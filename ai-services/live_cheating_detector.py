import cv2
import numpy as np
import mediapipe as mp

mp_face = mp.solutions.face_mesh

def check_cheating(frame_bytes):
    nparr = np.frombuffer(frame_bytes, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    with mp_face.FaceMesh(static_image_mode=True) as face:
        results = face.process(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
        if not results.multi_face_landmarks:
            return {"cheating": True}
        return {"cheating": False}
