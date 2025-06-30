from flask import Flask, request, jsonify
from recommend import recommend_courses
from career_video_analysis import analyze_career_video
from student_chatbot import chatbot_bp
import google.generativeai as genai
import os
import tempfile
import subprocess
import re
from pymongo import MongoClient
from dotenv import load_dotenv

# --- Init ---
load_dotenv("../server/.env")
MONGO_CONN = os.getenv("MONGO_CONN")

app = Flask(__name__)
app.register_blueprint(chatbot_bp)

# --- CORS ---
@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "http://localhost:3000"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS"
    return response

@app.route('/<path:path>', methods=['OPTIONS'])
def options_handler(path):
    return '', 204

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
        "-o", os.path.join(tempfile.gettempdir(), "%(id)s.%(ext)s"),
        video_url
    ]
    subprocess.run(cmd, capture_output=True, text=True)
    vid = extract_youtube_id(video_url)
    mp3_path = os.path.join(tempfile.gettempdir(), f"{vid}.mp3")
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

# --- Routes ---
@app.route("/recommend", methods=["POST"])
def recommend():
    data = request.get_json()
    student_id = data.get("student_id")
    refresh = data.get("refresh", False)
    if not student_id:
        return jsonify({"error": "Student ID missing"}), 400
    try:
        result = recommend_courses(student_id, refresh=refresh)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/analyze-career-video", methods=["POST"])
def analyze_video():
    data = request.get_json()
    video_url = data.get("video_url")
    if not video_url:
        return jsonify({"error": "video_url is required"}), 400
    try:
        result = analyze_career_video(video_url)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/suggest-course-metadata", methods=["POST"])
def suggest_course_metadata():
    data = request.get_json()
    title = data.get("title", "")
    if not title:
        return jsonify({"error": "Title is required"}), 400
    prompt = f"""
    Given the following YouTube course title{' and description' if data.get('description') else ''}, suggest:
    - The most relevant domain for this course
    - 3 to 5 ideal job roles
    - 3 to 5 key skills
    - 2 to 3 learning challenges
    Respond ONLY as JSON with keys: domain, idealRoles, skillsCovered, challengesAddressed.

    Course Title: {title}
    {"Course Description: " + data.get("description") if data.get("description") else ""}
    """
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        import json
        match = re.search(r"\{.*\}", response.text, re.DOTALL)
        return jsonify(json.loads(match.group(0))) if match else jsonify({"error": "AI response invalid"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/generate-transcript", methods=["POST"])
def generate_transcript():
    data = request.get_json()
    video_url = data.get("videoUrl")
    if not video_url:
        return jsonify({"error": "Missing videoUrl"}), 400
    try:
        video_id = extract_youtube_id(video_url).strip()
        audio_path = download_audio(video_url)
        if not audio_path:
            return jsonify({"error": "Audio download failed"}), 500
        transcript = run_whisper(audio_path)
        if not transcript:
            return jsonify({"error": "Whisper failed"}), 500
        course, lesson = find_lesson(video_id)
        if not course or not lesson:
            return jsonify({"error": "Lesson not found"}), 404
        save_transcript(course["_id"], lesson["_id"], video_id, transcript)
        return jsonify({"message": "Transcript saved", "videoId": video_id}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5001)
