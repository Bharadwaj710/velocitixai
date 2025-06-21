# career_video_analysis.py
print("✅ career_video_analysis.py loaded")

import os
import requests
import cloudinary
import cloudinary.uploader
import moviepy.editor as mp
import whisper
import cv2
import mediapipe as mp_face
import google.generativeai as genai
from dotenv import load_dotenv


# Use environment variables to set ffmpeg path
os.environ["FFMPEG_BINARY"] = r"C:\ffmpeg\ffmpeg-build\bin\ffmpeg.exe"
os.environ["PATH"] += os.pathsep + r"C:\ffmpeg\ffmpeg-build\bin"


# Load environment variables
load_dotenv("../server/.env")

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
gemini_model = genai.GenerativeModel("gemini-1.5-flash")

def download_video(cloud_url, save_path):
    response = requests.get(cloud_url)
    with open(save_path, 'wb') as f:
        f.write(response.content)

def extract_audio(video_path, audio_path):
    clip = mp.VideoFileClip(video_path)
    clip.audio.write_audiofile(audio_path)

def transcribe_audio(audio_path):
    model = whisper.load_model("base")
    result = model.transcribe(audio_path)
    return result["text"]

def analyze_transcript(text):
    prompt = f"""
    A student submitted the following career aspiration video transcript:

    "{text}"

    Based on their language, tone, and intent, provide:
    1. Confidence score (1–10)
    2. Communication clarity (1–10)
    3. Tone (confident / hesitant / passionate / unsure)
    4. 3–5 keywords about the student's interests or domain focus
    Return only this analysis in a readable format.
    """
    try:
        response = gemini_model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        return f"Gemini error: {e}"

def analyze_face_patterns(video_path):
    cap = cv2.VideoCapture(video_path)
    face_mesh = mp_face.solutions.face_mesh.FaceMesh(static_image_mode=False)

    total_frames = 0
    face_visible_frames = 0

    while cap.isOpened():
        success, frame = cap.read()
        if not success:
            break

        total_frames += 1
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = face_mesh.process(rgb_frame)

        if results.multi_face_landmarks:
            face_visible_frames += 1

    cap.release()
    face_mesh.close()

    return round((face_visible_frames / total_frames) * 100, 2) if total_frames else 0.0

def analyze_career_video(cloud_url):
    local_video = "temp_video.mp4"
    local_audio = "temp_audio.wav"

    try:
        download_video(cloud_url, local_video)
        extract_audio(local_video, local_audio)
        transcript = transcribe_audio(local_audio)
        ai_feedback = analyze_transcript(transcript)
        eye_contact_percent = analyze_face_patterns(local_video)

        return {
            "transcript": transcript,
            "ai_feedback": ai_feedback,
            "eye_contact_percent": eye_contact_percent
        }

    finally:    
        # Always delete temp files if they exist
        if os.path.exists(local_video):
            os.remove(local_video)
        if os.path.exists(local_audio):
            os.remove(local_audio)
