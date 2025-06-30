import sys
import os
import re
import tempfile
import subprocess
from pymongo import MongoClient
from dotenv import load_dotenv
from bson import ObjectId

# --- Config ---
load_dotenv("../server/.env")
MONGO_CONN = os.getenv("MONGO_CONN")
AUDIO_DIR = tempfile.gettempdir()

# --- Shared Functions ---
def extract_youtube_id(url):
    patterns = [r"(?:v=|\/)([0-9A-Za-z_-]{11})"]
    for pat in patterns:
        m = re.search(pat, url)
        if m:
            return m.group(1)
    return None

def download_audio(video_url):
    print(f"[PY] Downloading audio for {video_url}")
    cmd = [
        "yt-dlp", "-f", "bestaudio", "--extract-audio",
        "--audio-format", "mp3",
        "-o", os.path.join(AUDIO_DIR, "%(id)s.%(ext)s"),
        video_url
    ]
    subprocess.run(cmd, capture_output=True, text=True)
    vid = extract_youtube_id(video_url)
    mp3_path = os.path.join(AUDIO_DIR, f"{vid}.mp3")
    return mp3_path if os.path.exists(mp3_path) else None

def run_whisper(audio_path):
    print(f"[PY] Running Whisper on {audio_path}")
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
        {"courseId": course_id, "lessonId": lesson_id, "videoId": video_id},
        {
            "$set": {
                "courseId": course_id,
                "lessonId": lesson_id,
                "videoId": video_id,
                "transcript": transcript,
            }
        },
        upsert=True
    )

def find_lesson(video_id):
    client = MongoClient(MONGO_CONN)
    db = client["auth_db"]
    for course in db["courses"].find():
        for week in course.get("weeks", []):
            for module in week.get("modules", []):
                for lesson in module.get("lessons", []):
                    if lesson.get("videoId", "").strip() == video_id:
                        return course, lesson
    return None, None

# --- Main Script ---
def main():
    if len(sys.argv) < 2:
        print("Usage: python generate_transcript.py <YouTube URL>")
        sys.exit(1)

    video_url = sys.argv[1]
    video_id = extract_youtube_id(video_url)
    if not video_id:
        print("[PY] Invalid YouTube URL.")
        sys.exit(1)

    video_id = video_id.strip()
    audio_path = download_audio(video_url)
    if not audio_path:
        print("[PY] Audio download failed.")
        sys.exit(1)

    transcript = run_whisper(audio_path)
    if not transcript:
        print("[PY] Whisper failed.")
        sys.exit(1)

    course, lesson = find_lesson(video_id)
    if not course or not lesson:
        print("[PY] ❌ No matching lesson found.")
        sys.exit(1)

    save_transcript(course["_id"], lesson["_id"], video_id, transcript)
    print(f"[PY] ✅ Transcript stored for course '{course.get('title')}', lesson '{lesson.get('title')}'")

if __name__ == "__main__":
    main()
