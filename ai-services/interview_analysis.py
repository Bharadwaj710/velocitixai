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
gemini_model = genai.GenerativeModel("gemini-1.5-flash")

# === Helper Functions ===

def download_video(cloud_url, save_path="temp_interview_video.mp4"):
    response = requests.get(cloud_url)
    with open(save_path, 'wb') as f:
        f.write(response.content)
    return save_path

def extract_audio(video_path, audio_path="temp_interview_audio.wav"):
    clip = mp.VideoFileClip(video_path)
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
    Main callable function to analyze student AI interview.
    """
    video_path = "temp_interview_video.mp4"
    audio_path = "temp_interview_audio.wav"

    try:
        # Download and process video/audio
        download_video(video_url, video_path)
        extract_audio(video_path, audio_path)
        transcript = transcribe_audio(audio_path)
        ai_feedback = analyze_transcript(transcript)
        face_stats = analyze_face_visibility(video_path)

        return {
            "studentId": student_id,
            "answers": answers,
            "transcript": transcript,
            "ai_feedback": ai_feedback,
            "face_stats": face_stats,
            "cheating_detected": (
                face_stats.get("multipleFaceFrames", 0) > 5
                or face_stats.get("faceVisiblePercent", 0) < 60
            )
        }

    finally:
        if os.path.exists(video_path):
            os.remove(video_path)
        if os.path.exists(audio_path):
            os.remove(audio_path)
