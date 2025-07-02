import os
import re
import tempfile
import subprocess
from flask import Flask, request, jsonify
from pymongo import MongoClient
from dotenv import load_dotenv
from bson import ObjectId

# --- Config ---
load_dotenv("../server/.env")
MONGO_CONN = os.getenv("MONGO_CONN")
AUDIO_DIR = tempfile.gettempdir()

app = Flask(__name__)

# --- Utilities ---
def extract_youtube_id(url):
    match = re.search(r"(?:v=|\/)([0-9A-Za-z_-]{11})", url)
    return match.group(1) if match else None

def download_audio(video_url):
    print(f"[PY] Downloading audio for {video_url}")
    cmd = [
        "yt-dlp", "-f", "bestaudio", "--extract-audio",
        "--audio-format", "mp3",
        "-o", os.path.join(AUDIO_DIR, "%(id)s.%(ext)s"),
        video_url
    ]
    subprocess.run(cmd, capture_output=True, text=True)
    video_id = extract_youtube_id(video_url)
    mp3_path = os.path.join(AUDIO_DIR, f"{video_id}.mp3")
    return mp3_path if os.path.exists(mp3_path) else None

def run_whisper(audio_path):
    try:
        import whisper
        model = whisper.load_model("base")
        result = model.transcribe(audio_path, verbose=False)
        return [
            {
                "start": seg["start"],
                "end": seg["end"],
                "text": seg["text"].strip()
            }
            for seg in result.get("segments", [])
        ]
    except Exception as e:
        print(f"[PY] Whisper error: {e}")
        return None

def save_transcript(course_id, lesson_id, video_id, transcript):
    client = MongoClient(MONGO_CONN)
    db = client["auth_db"]
    db["transcripts"].update_one(
        {
            "courseId": ObjectId(course_id),
            "lessonId": ObjectId(lesson_id),
            "videoId": video_id
        },
        {
            "$set": {
                "courseId": ObjectId(course_id),
                "lessonId": ObjectId(lesson_id),
                "videoId": video_id,
                "transcript": transcript
            }
        },
        upsert=True
    )

# --- Route ---
@app.route("/generate-transcript", methods=["POST"])
def generate_transcript():
    data = request.get_json()
    video_url = data.get("videoUrl")
    video_id = data.get("videoId")
    lesson_id = data.get("lessonId")
    course_id = data.get("courseId")

    if not all([video_url, video_id, lesson_id, course_id]):
        return jsonify({"error": "Missing required fields"}), 400

    print(f"[PY] Processing transcript for lesson {lesson_id}")

    audio_path = download_audio(video_url)
    if not audio_path:
        return jsonify({"error": "Audio download failed"}), 500

    transcript = run_whisper(audio_path)
    if not transcript:
        return jsonify({"error": "Transcription failed"}), 500

    save_transcript(course_id, lesson_id, video_id, transcript)
    return jsonify({"message": "Transcript stored successfully", "segments": transcript})

# --- Main ---
if __name__ == "__main__":
    app.run(port=5001)
