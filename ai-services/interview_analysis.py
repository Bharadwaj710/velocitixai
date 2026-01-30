import os
import re
import json
import requests
import cloudinary
import cloudinary.uploader
import moviepy.editor as mp
import whisper
import cv2
import mediapipe as mp_face
import google.generativeai as genai
from dotenv import load_dotenv

# Set FFMPEG path if on Windows
os.environ["FFMPEG_BINARY"] = r"C:\ffmpeg\ffmpeg-build\bin\ffmpeg.exe"
os.environ["PATH"] += os.pathsep + r"C:\ffmpeg\ffmpeg-build\bin"

# Load environment variables
load_dotenv("../server/.env")

# Cloudinary config
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

# Gemini config
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
gemini_model = genai.GenerativeModel("gemini-2.5-flash")

# === Helper Functions ===

def download_video(cloud_url, save_path):
    response = requests.get(cloud_url, stream=True)
    with open(save_path, 'wb') as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)
    return save_path

def extract_audio(video_path, audio_path):
    with mp.VideoFileClip(video_path) as clip:
        clip.audio.write_audiofile(audio_path)
    return audio_path

def transcribe_audio(audio_path):
    model = whisper.load_model("base")
    result = model.transcribe(audio_path)
    return result["text"]

def extract_json(raw_text):
    try:
        match = next(re.finditer(r"\{.*\}", raw_text, re.DOTALL))
        return json.loads(match.group())
    except:
        return {"error": "Invalid JSON in Gemini output"}

def analyze_transcript(text):
    prompt = f"""
    A student completed a 10-question AI interview. Analyze their transcript and return this as JSON:
    {{
      "confidence": "1–10",
      "clarity": "1–10",
      "tone": "confident / nervous / unsure / passionate / neutral",
      "keywords": ["list of 3–5 relevant terms"],
      "careerFocused": "Yes / No (with reason)",
      "subjectKnowledgeScore": "Rate from 1–10 how well the student understood the subject based on their transcript and explanations"
    }}

    Transcript:
    {text}
    """
    try:
        response = gemini_model.generate_content(prompt)
        cleaned = extract_json(response.text)
        return cleaned
    except Exception as e:
        return {"error": f"Gemini error: {str(e)}"}

def analyze_face_visibility(video_path):
    cap = cv2.VideoCapture(video_path)
    face_mesh = mp_face.solutions.face_mesh.FaceMesh(static_image_mode=False)
    
    total = 0
    face_frames = 0
    multiple_faces = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        total += 1
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        result = face_mesh.process(rgb)

        if result.multi_face_landmarks:
            face_count = len(result.multi_face_landmarks)
            if face_count == 1:
                face_frames += 1
            elif face_count > 1:
                multiple_faces += 1

    cap.release()
    face_mesh.close()

    face_visible_percent = round((face_frames / total) * 100, 2) if total else 0
    return {
        "faceVisiblePercent": face_visible_percent,
        "multipleFaceFrames": multiple_faces,
        "totalFrames": total
    }

# === Exported Analysis Function ===

def analyze_interview(video_url, answers, student_id):
    """
    Full AI interview analysis pipeline.
    Returns data structured for InterviewReport model.
    """
    unique_id = str(student_id)
    video_path = f"temp_interview_video_{unique_id}.mp4"
    audio_path = f"temp_interview_audio_{unique_id}.wav"

    try:
        print(f"[AI Interview] Starting analysis for student={student_id}")
        
        # 1️⃣ Download & process video/audio
        download_video(video_url, video_path)
        extract_audio(video_path, audio_path)

        # 2️⃣ Transcribe
        print("[AI Interview] Transcribing audio...")
        transcript = transcribe_audio(audio_path)

        # 3️⃣ NLP-based analysis
        print("[AI Interview] Analyzing transcript via Gemini...")
        ai_feedback = analyze_transcript(transcript)

        # 4️⃣ Facial analysis
        print("[AI Interview] Analyzing face visibility...")
        face_stats = analyze_face_visibility(video_path)

        # === 5️⃣ Compute normalized scores ===
        def safe_num(val, default=5):
            try:
                if isinstance(val, (int, float)):
                    return float(val)
                if isinstance(val, str) and val.isdigit():
                    return float(val)
                match = re.search(r'\d+', str(val))
                return float(match.group()) if match else default
            except:
                return default

        tone_conf = min(100, safe_num(ai_feedback.get("confidence", 5)) * 10)
        communication = min(100, safe_num(ai_feedback.get("clarity", 5)) * 10)
        technical = min(100, safe_num(ai_feedback.get("subjectKnowledgeScore", 5)) * 10)
        soft_skills = 80 if str(ai_feedback.get("careerFocused", "")).lower().startswith("yes") else 50
        eye_contact = face_stats.get("faceVisiblePercent", 0)
        total = round((tone_conf + communication + technical + soft_skills + eye_contact) / 5, 2)

        overall_scores = {
            "toneConfidence": tone_conf,
            "communication": communication,
            "technical": technical,
            "softSkills": soft_skills,
            "eyeContact": eye_contact,
            "total": total
        }

        # === 6️⃣ Per-question breakdown ===
        per_question = []
        for i, ans in enumerate(answers or []):
            per_question.append({
                "index": i,
                "question": ans.get("question", ""),
                "answer": ans.get("answer", ""),
                "scores": {
                    "toneConfidence": tone_conf,
                    "communication": communication,
                    "technical": technical,
                    "softSkills": soft_skills,
                    "eyeContact": eye_contact,
                },
                "feedback": f"Answer {i+1}: Good effort with clear communication."
            })

        # === 7️⃣ Return structured analysis ===
        result = {
            "studentId": student_id,
            "overallScores": overall_scores,
            "perQuestion": per_question,
            "ai_feedback": ai_feedback,
            "face_stats": face_stats,
            "transcript": transcript,
            "cheating_detected": (
                face_stats.get("multipleFaceFrames", 0) > 5 or
                face_stats.get("faceVisiblePercent", 0) < 60
            ),
        }

        print("[AI Interview] ✅ Analysis complete.")
        return result

    except Exception as e:
        print("❌ [AI Interview] Error:", str(e))
        return {"error": str(e)}

    finally:
        if os.path.exists(video_path): os.remove(video_path)
        if os.path.exists(audio_path): os.remove(audio_path)
