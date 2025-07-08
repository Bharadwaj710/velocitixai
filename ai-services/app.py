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
from flask_cors import CORS
from generate_quiz import generate_quiz_from_transcript

# --- Init ---
load_dotenv("../server/.env")
MONGO_CONN = os.getenv("MONGO_CONN")

app = Flask(__name__)
CORS(app)
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
    import traceback
    import json

    try:
        # Get input data
        data = request.get_json()
        title = data.get("title", "").strip()
        description = data.get("description", "").strip()

        if not title:
            return jsonify({"error": "Course title is required"}), 400

        # Get and validate API key
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return jsonify({"error": "GEMINI_API_KEY not set in environment"}), 500

        genai.configure(api_key=api_key)

        # Allowed domains
        allowed_domains = [
            "Technology and Innovation",
            "Healthcare and Wellness",
            "Business and Finance",
            "Arts and Creativity",
            "Education and Social Services"
        ]

        # Build prompt
        prompt = f"""
        Given the following YouTube course title{" and description" if description else ""}, suggest:
        - The most relevant domain for this course (choose ONLY from: {', '.join(allowed_domains)})
        - 3 to 5 ideal job roles
        - 3 to 5 key skills
        - 2 to 3 learning challenges

        Respond ONLY as JSON with keys: domain, idealRoles, skillsCovered, challengesAddressed.

        Course Title: {title}
        {"Course Description: " + description if description else ""}
        """

        # Call Gemini
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)

        try:
            response_text = response.text
        except Exception:
            response_text = str(response)

        print(">> Gemini Response Text:")
        print(response_text)

        # Extract JSON from text
        match = re.search(r"\{[\s\S]*?\}", response_text)
        if not match:
            raise ValueError("No JSON found in Gemini response.")

        metadata = json.loads(match.group(0))

        if metadata.get("domain") not in allowed_domains:
            raise ValueError(f"Domain {metadata.get('domain')} not allowed.")

        return jsonify(metadata), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({
            "error": str(e),
            "rawResponse": response_text if 'response_text' in locals() else "none"
        }), 500

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

@app.route("/generate-quiz", methods=["POST"])
def generate_quiz():
    data = request.get_json()
    if not data or "transcript" not in data:
        return jsonify({"error": "Transcript is required"}), 400

    raw_transcript = data["transcript"]

    # 🔧 Handle array of transcript segments (extract text and join)
    if isinstance(raw_transcript, list):
        transcript = " ".join(seg.get("text", "") for seg in raw_transcript)
    elif isinstance(raw_transcript, str):
        transcript = raw_transcript.strip()
    else:
        return jsonify({"error": "Invalid transcript format"}), 400

    # ✅ Generate quiz using Gemini
    quiz = generate_quiz_from_transcript(transcript)
    return jsonify(quiz), 200


if __name__ == "__main__":
    app.run(port=5001)
