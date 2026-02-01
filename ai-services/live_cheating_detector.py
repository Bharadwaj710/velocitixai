import cv2
import numpy as np
from collections import deque, defaultdict
import time
import mediapipe as mp
import math
import traceback
import statistics
import os

# ---------- MediaPipe init ----------
mp_face_detection = mp.solutions.face_detection
mp_face_mesh = mp.solutions.face_mesh

FACE_DET = mp_face_detection.FaceDetection(
    model_selection=0, min_detection_confidence=0.5
)
FACE_MESH = mp_face_mesh.FaceMesh(
    static_image_mode=False,
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5,
)

# ---------- Per-session state ----------
# Use session id (e.g., user id) to keep per-user state for calibration/debounce.
STATE = defaultdict(
    lambda: {
        "warning_given": False,
        "cancelled": False,
        "stable_frames": 0,
        "bad_frames": 0,
        "yaw_buf": deque(maxlen=3),
        "pitch_buf": deque(maxlen=3),
        "earL_buf": deque(maxlen=9),
        "earR_buf": deque(maxlen=9),
        "noface_frames": 0,
        "mesh_fail_frames": 0,
        # calibration fields:
        "baseline_ready": False,
        "calib_count": 0,
        "yaw_calib": [],
        "pitch_calib": [],
        "last_warning_time": 0.0,
        # new / added fields:
        "last_critical_time": None,   # when first no-face/multi-face seen
        "last_warning_str": None,     # last warning text for cooldown
        "calib_start_time": None,     # time when calibration began
    }
)
# ---------- Tuning parameters (adjust these as needed) ----------
CALIBRATION_TIME_SEC = 4.0      # seconds to build baseline (4s calibration)
NO_FACE_TOLERANCE = 1           # allow tiny detection glitches
MESH_FAIL_TOLERANCE = 3
DETECTION_CONF_THRESHOLD = 0.50

USE_EAR = False                 # keep EAR disabled (you asked to ignore eye movement)
EAR_THRESH_ENTER = 0.18
EAR_THRESH_EXIT = 0.22

# Head movement thresholds — increased to make detector less sensitive to slight turns
YAW_WARN = 50.0                 # degrees (larger = less sensitive)
PITCH_WARN = 40.0               # degrees
DEADZONE = 10.0                 # extra deadzone

# Grace + debounce
CRITICAL_GRACE_PERIOD = 3.0     # seconds before no-face / multi-face becomes critical
BAD_FRAME_LIMIT = 6             # consecutive bad frames before repeated-warning logic
RESET_STABLE_FRAMES = 5
WARNING_COOLDOWN = 2.0          # seconds before repeating the same toast
DEBUG = os.environ.get("CHEAT_DETECTOR_DEBUG", "0") == "1"

# ---------- Utilities ----------
def _landmark_to_xy(landmark, w, h):
    return np.array([landmark.x * w, landmark.y * h], dtype=np.float32)


def _eye_aspect_ratio(eye_pts):
    try:
        p = [np.array(pt, dtype=np.float32) for pt in eye_pts]
        p1, p2, p3, p4, p5, p6 = p
        num = np.linalg.norm(p2 - p6) + np.linalg.norm(p3 - p5)
        den = 2.0 * np.linalg.norm(p1 - p4) + 1e-6
        return float(num / den)
    except Exception:
        return None


def _solve_head_pose(img_w, img_h, face_landmarks):
    """
    SolvePnP head-pose estimate (yaw, pitch).
    Returns (yaw, pitch) in degrees or (None, None) on failure.
    """
    try:
        IDX = {
            "left_eye_outer": 33,
            "right_eye_outer": 263,
            "nose_tip": 1,
            "mouth_left": 61,
            "mouth_right": 291,
            "chin": 199,
        }
        model_points_3d = np.array(
            [
                [-0.3, 0.0, 0.0],
                [0.3, 0.0, 0.0],
                [0.0, 0.1, 0.3],
                [-0.2, -0.35, 0.0],
                [0.2, -0.35, 0.0],
                [0.0, -0.7, 0.0],
            ],
            dtype=np.float32,
        )

        pts2d = []
        for k in [
            "left_eye_outer",
            "right_eye_outer",
            "nose_tip",
            "mouth_left",
            "mouth_right",
            "chin",
        ]:
            lm = face_landmarks.landmark[IDX[k]]
            pts2d.append([lm.x * img_w, lm.y * img_h])
        pts2d = np.array(pts2d, dtype=np.float32)

        focal = img_w
        cam_matrix = np.array(
            [[focal, 0, img_w / 2], [0, focal, img_h / 2], [0, 0, 1]],
            dtype=np.float32,
        )
        dist_coeffs = np.zeros((4, 1), dtype=np.float32)

        success, rvec, tvec = cv2.solvePnP(
            model_points_3d,
            pts2d,
            cam_matrix,
            dist_coeffs,
            flags=cv2.SOLVEPNP_ITERATIVE,
        )
        if not success:
            return None, None

        R, _ = cv2.Rodrigues(rvec)
        sy = math.sqrt(R[0, 0] ** 2 + R[1, 0] ** 2)
        pitch = math.degrees(math.atan2(-R[2, 0], sy))
        yaw = math.degrees(math.atan2(R[1, 0], R[0, 0]))
        return float(yaw), float(pitch)
    except Exception:
        return None, None


def _get_eye_points(face_landmarks, w, h, is_left=True):
    idxs_left = [33, 160, 158, 133, 153, 144]
    idxs_right = [263, 387, 385, 362, 380, 373]
    idxs = idxs_left if is_left else idxs_right
    pts = []
    for i in idxs:
        lm = face_landmarks.landmark[i]
        pts.append(tuple(_landmark_to_xy(lm, w, h)))
    return pts


# ---------- Main function ----------
def check_cheating(frame_bytes: bytes, session_id: str = "default"):
    """
    Improved check_cheating:
    - time-based calibration (CALIBRATION_TIME_SEC)
    - grace period for criticals (CRITICAL_GRACE_PERIOD)
    - reduced sensitivity to small head movements
    - ignore eye movement (USE_EAR=False)
    - warning cooldown + debounce
    """
    st = STATE[session_id]

    # Ensure baseline keys exist (defensive)
    if "baseline_ready" not in st:
        st["baseline_ready"] = False
        st["calib_count"] = 0
        st["yaw_calib"] = []
        st["pitch_calib"] = []
        st["calib_start_time"] = None

    # If cancelled, return stable response
    if st.get("cancelled", False):
        metrics = {
            "faces": 0,
            "det_conf": None,
            "yaw_raw": None,
            "pitch_raw": None,
            "yaw_med": None,
            "pitch_med": None,
            "noface_frames": int(st.get("noface_frames", 0)),
            "mesh_fail_frames": int(st.get("mesh_fail_frames", 0)),
            "bad_frames": int(st.get("bad_frames", 0)),
            "stable_frames": int(st.get("stable_frames", 0)),
            "baseline_ready": bool(st.get("baseline_ready", False)),
        }
        response = {
            "cheating": True,
            "reason": "❌ Interview cancelled previously",
            "metrics": metrics,
            "critical": ["cancelled"],
            "reasons": [],
            "baseline_ready": bool(st.get("baseline_ready", False)),
        }
        if DEBUG:
            response["debug"] = {"state": "already_cancelled", **st}
        print(f"[CheatDetector:{session_id}] already cancelled -> returning cheating=True")
        return response

    try:
        # decode frame bytes safely
        nparr = np.frombuffer(frame_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if frame is None:
            metrics = {
                "faces": None,
                "det_conf": None,
                "yaw_raw": None,
                "pitch_raw": None,
            }
            return {"cheating": False, "reason": "decode-failed", "metrics": metrics, "critical": [], "reasons": [], "baseline_ready": bool(st.get("baseline_ready", False))}

        h, w = frame.shape[:2]
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        mean_brightness = float(np.mean(gray))

        # Face detection (fast)
        try:
            face_det_res = FACE_DET.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            faces = face_det_res.detections or []
        except Exception:
            faces = []

        face_count = len(faces)
        det_confidence = None
        if faces:
            try:
                det_confidence = float(faces[0].score[0]) if hasattr(faces[0], "score") else None
            except Exception:
                det_confidence = None

        yaw = pitch = None
        reason = None
        violation_types = []

        # --- Face presence and mesh checks ---
        if face_count == 0:
            st["noface_frames"] = st.get("noface_frames", 0) + 1
            if st["noface_frames"] > NO_FACE_TOLERANCE:
                # Reason kept short (used for message). We'll manage grace in later logic.
                reason = "No face visible"
                violation_types.append("noface")
        elif face_count > 1:
            st["multi_frames"] = st.get("multi_frames", 0) + 1
            if st["multi_frames"] > (NO_FACE_TOLERANCE + 3):
                reason = "Multiple faces detected"
                violation_types.append("multiple_faces")
        else:
            # exactly one face -> reset multi/no-face counters and timers
            st["noface_frames"] = 0
            st["multi_frames"] = 0
            st["last_critical_time"] = None  # user corrected the critical condition

            # if detection confidence exists and is low -> candidate mesh fail
            if det_confidence is not None and det_confidence < DETECTION_CONF_THRESHOLD:
                st["mesh_fail_frames"] += 1
                if st["mesh_fail_frames"] > MESH_FAIL_TOLERANCE:
                    reason = f"Detection low confidence ({det_confidence:.2f})"
                    violation_types.append("low_conf")
            else:
                st["mesh_fail_frames"] = 0
                # compute mesh landmarks
                try:
                    mesh_res = FACE_MESH.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
                    fl = mesh_res.multi_face_landmarks[0] if mesh_res.multi_face_landmarks else None
                except Exception:
                    fl = None

                if fl is None:
                    st["mesh_fail_frames"] += 1
                    if st["mesh_fail_frames"] > MESH_FAIL_TOLERANCE:
                        reason = f"Face landmarks missing ({st['mesh_fail_frames']})"
                        violation_types.append("mesh_fail")
                else:
                    st["mesh_fail_frames"] = 0

                    # compute head-pose (yaw, pitch)
                    yaw, pitch = _solve_head_pose(w, h, fl)
                    if yaw is not None:
                        st["yaw_buf"].append(float(yaw))
                    if pitch is not None:
                        st["pitch_buf"].append(float(pitch))

                    # MEDIANS for smoothing
                    med_yaw = statistics.median(st["yaw_buf"]) if st["yaw_buf"] else 0.0
                    med_pitch = statistics.median(st["pitch_buf"]) if st["pitch_buf"] else 0.0

                    # --- Calibration (time-based) ---
                    if not st.get("baseline_ready", False):
                        now = time.time()
                        if st.get("calib_start_time") is None:
                            st["calib_start_time"] = now
                            st["yaw_calib"] = []
                            st["pitch_calib"] = []
                        # Collect medians while calibration time not expired
                        st["yaw_calib"].append(med_yaw)
                        st["pitch_calib"].append(med_pitch)
                        elapsed = now - st["calib_start_time"]
                        if elapsed >= CALIBRATION_TIME_SEC and len(st["yaw_calib"]) >= 5:
                            # set baseline as median of collected values
                            try:
                                st["yaw_baseline"] = float(statistics.median(st["yaw_calib"]))
                                st["pitch_baseline"] = float(statistics.median(st["pitch_calib"]))
                                st["baseline_ready"] = True
                                # Reset buffers after calibration to avoid immediate jitter
                                st["yaw_buf"].clear()
                                st["pitch_buf"].clear()
                            except Exception:
                                st["baseline_ready"] = False
                                st["calib_start_time"] = None
                    else:
                        # baseline ready -> compute deviations relative to baseline
                        yaw_dev = abs(med_yaw - st.get("yaw_baseline", 0.0))
                        pitch_dev = abs(med_pitch - st.get("pitch_baseline", 0.0))

                        # Only treat *big* movements as warnings (less sensitive)
                        if yaw_dev >= (YAW_WARN + DEADZONE):
                            reason = "Head turned"
                            violation_types.append("yaw")
                        elif pitch_dev >= (PITCH_WARN + DEADZONE):
                            reason = "Head tilted"
                            violation_types.append("pitch")
                        else:
                            # ignore EAR / eye movement entirely (USE_EAR=False)
                            reason = None

                        # slowly adapt baseline when stable for a while
                        if st["stable_frames"] > 30 and st.get("yaw_baseline") is not None:
                            st["yaw_baseline"] = 0.95 * st["yaw_baseline"] + 0.05 * med_yaw
                            st["pitch_baseline"] = 0.95 * st["pitch_baseline"] + 0.05 * med_pitch

        # Decision/debounce logic (per-frame)
        if reason:
            st["bad_frames"] += 1
            st["stable_frames"] = 0
        else:
            st["bad_frames"] = 0
            st["stable_frames"] += 1
            if st["stable_frames"] >= RESET_STABLE_FRAMES:
                st["warning_given"] = False
                st["last_warning_str"] = None

        # Determine final categories: critical vs warning (and handle grace for criticals)
        critical_reasons = []
        warning_reasons = []
        cheating = False

        now = time.time()
        if reason:
            low = str(reason).lower()

            # Handle no-face / multiple-face with grace period (allow frontend toast)
            if "no face" in low or "multiple" in low:
                # first time we see this critical kind -> set timestamp & warn
                if st.get("last_critical_time") is None:
                    st["last_critical_time"] = now
                    # warning (red toast) but no attempt deduction yet
                    warning_reasons.append(reason)
                    cheating = False
                else:
                    # If still persisting beyond grace period -> escalate to critical
                    if now - st["last_critical_time"] >= CRITICAL_GRACE_PERIOD:
                        critical_reasons.append(reason)
                        cheating = True
                    else:
                        warning_reasons.append(reason)
                        cheating = False
            else:
                # For any other reason, reset critical timer (face corrected)
                st["last_critical_time"] = None

                # Compose warning text for head movement and other non-critical issues.
                # Use cooldown so same warning isn't repeatedly sent each frame.
                warn_text = reason
                last_warn = st.get("last_warning_str")
                last_warn_time = st.get("last_warning_time", 0.0)
                if (warn_text != last_warn) or (now - last_warn_time) > WARNING_COOLDOWN:
                    warning_reasons.append(warn_text)
                    st["last_warning_str"] = warn_text
                    st["last_warning_time"] = now
                    cheating = False
                else:
                    # If same warning within cooldown: do not spam
                    cheating = False

            # Repeated bad frames escalation (for e.g. large jitter) -- keep as warning/escalation
            if st["bad_frames"] >= BAD_FRAME_LIMIT and st.get("baseline_ready", False):
                # If not already flagged, set a single warning instead of immediate termination.
                if not st.get("warning_given", False):
                    st["warning_given"] = True
                    st["bad_frames"] = 0
                    st["last_warning_time"] = now
                    # ensure an explanatory message is present
                    if reason and reason not in warning_reasons:
                        warning_reasons.append(reason)
                    cheating = False
                else:
                    # repeated confirmed bad -> escalate (but we treat this conservatively)
                    if reason and reason not in warning_reasons:
                        warning_reasons.append(reason)
                    cheating = False

        # Build metrics to help frontend and Node controller
        metrics = {
            "faces": int(face_count),
            "det_conf": float(det_confidence) if det_confidence is not None else None,
            "yaw_raw": float(yaw) if yaw is not None else None,
            "pitch_raw": float(pitch) if pitch is not None else None,
            "yaw_med": statistics.median(st["yaw_buf"]) if st["yaw_buf"] else None,
            "pitch_med": statistics.median(st["pitch_buf"]) if st["pitch_buf"] else None,
            "noface_frames": int(st.get("noface_frames", 0)),
            "mesh_fail_frames": int(st.get("mesh_fail_frames", 0)),
            "bad_frames": int(st.get("bad_frames", 0)),
            "stable_frames": int(st.get("stable_frames", 0)),
            "baseline_ready": bool(st.get("baseline_ready", False)),
            "yaw_baseline": float(st.get("yaw_baseline")) if st.get("yaw_baseline") is not None else None,
            "pitch_baseline": float(st.get("pitch_baseline")) if st.get("pitch_baseline") is not None else None,
            "mean_brightness": mean_brightness,
        }

        # Build user-facing reason text
        final_reason = None
        if critical_reasons:
            final_reason = "❌ " + " | ".join(critical_reasons)
        elif warning_reasons:
            final_reason = "⚠️ " + " | ".join(warning_reasons)

        response = {
            "cheating": bool(cheating),
            "reason": final_reason,
            "metrics": metrics,
            "critical": critical_reasons,
            "reasons": warning_reasons,
            "baseline_ready": bool(st.get("baseline_ready", False)),
        }

        if DEBUG:
            response["debug"] = {
                "violation_types": violation_types,
                "yaw_buf": list(st["yaw_buf"]),
                "pitch_buf": list(st["pitch_buf"]),
                "last_warning_time": st.get("last_warning_time"),
                "last_critical_time": st.get("last_critical_time"),
                "cancelled": st.get("cancelled", False),
                "calib_start_time": st.get("calib_start_time"),
                "calib_count": len(st.get("yaw_calib", [])),
            }

        # concise console log
        try:
            print(
                f"[CheatingCheck:{session_id}] cheating={response['cheating']}, critical={critical_reasons}, reasons={warning_reasons}, faces={metrics['faces']}, yaw={metrics['yaw_raw']}, pitch={metrics['pitch_raw']}, baseline_ready={response['baseline_ready']}"
            )
        except Exception:
            pass

        return response

    except Exception as ex:
        traceback.print_exc()
        metrics = {
            "faces": None,
            "det_conf": None,
            "yaw_raw": None,
            "pitch_raw": None,
            "yaw_med": None,
            "pitch_med": None,
        }
        return {
            "cheating": False,
            "reason": f"internal-error: {ex}",
            "metrics": metrics,
            "critical": [],
            "reasons": [],
            "baseline_ready": bool(st.get("baseline_ready", False)),
        }

def clear_session(session_id: str):
    if session_id in STATE:
        del STATE[session_id]
