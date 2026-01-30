import os
import requests
import cloudinary
import cloudinary.uploader
import moviepy.editor as mp
import whisper
import cv2
import mediapipe as mp_face
import google.generativeai as genai
import uuid
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
gemini_model = genai.GenerativeModel("gemini-2.5-flash")

def download_video(cloud_url, save_path):
    response = requests.get(cloud_url)
    with open(save_path, 'wb') as f:
        f.write(response.content)

def extract_audio(video_path, audio_path):
    with mp.VideoFileClip(video_path) as clip:
        clip.audio.write_audiofile(audio_path)

def transcribe_audio(audio_path):
    model = whisper.load_model("base")
    result = model.transcribe(audio_path)
    return result["text"]

def analyze_transcript(text):
    prompt = f"""
    A student submitted the following career aspiration video transcript:

    "{text}"

    Analyze this transcript and return a JSON object with the following fields:
    1. confidence_score (Number 1–10)
    2. communication_clarity (Number 1–10)
    3. tone (String: "confident", "hesitant", "passionate", or "unsure")
    4. keywords (List of 3–5 strings about the student's interests or domain focus)
    5. corrected_level (String: "Beginner", "Intermediate", or "Proficient" based on the above)

    Return ONLY the JSON.
    """
    try:
        response = gemini_model.generate_content(prompt)
        # Attempt to extract JSON if Gemini wraps it in markdown blocks
        import re
        import json
        text_resp = response.text.strip()
        match = re.search(r'\{.*\}', text_resp, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        return json.loads(text_resp)
    except Exception as e:
        print(f"Gemini error: {e}")
        return {
            "confidence_score": 5,
            "communication_clarity": 5,
            "tone": "neutral",
            "keywords": [],
            "corrected_level": "Beginner",
            "error": str(e)
        }

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
    unique_id = uuid.uuid4().hex
    local_video = f"temp_video_{unique_id}.mp4"
    local_audio = f"temp_audio_{unique_id}.wav"

    try:
        download_video(cloud_url, local_video)
        extract_audio(local_video, local_audio)
        transcript = transcribe_audio(local_audio)
        ai_feedback = analyze_transcript(transcript)
        eye_contact_percent = analyze_face_patterns(local_video)

        return {
            "transcript": transcript,
            "eye_contact_percent": eye_contact_percent,
            **ai_feedback
        }

    finally:    
        # Always delete temp files if they exist
        if os.path.exists(local_video):
            os.remove(local_video)
        if os.path.exists(local_audio):
            os.remove(local_audio)