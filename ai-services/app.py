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
from score_quiz import score_quiz_with_ai
from interview_analysis import analyze_interview
from live_cheating_detector import check_cheating, clear_session
from utils.progress_tracker import set_progress, get_progress
from bson.objectid import ObjectId
from generate_next_question import generate_next_question

# =========================
#  LOAD ENV VARIABLES
# =========================
# For production, load .env from same folder. For local, prefer server/.env.
if os.path.exists("../server/.env"):
    load_dotenv("../server/.env")
else:
    load_dotenv()  

MONGO_CONN = os.getenv("MONGO_CONN")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not MONGO_CONN:
    print("❌ ERROR: MONGO_CONN missing in environment!")
if not GEMINI_API_KEY:
    print("❌ ERROR: GEMINI_API_KEY missing in environment!")

# =========================
#  CONFIGURE GEMINI
# =========================
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-2.5-flash")  # Change if using different model

# =========================
#  INIT FLASK APP
# =========================
app = Flask(__name__)

# Allow requests from Vercel + Node backend (Render) in production
CORS(app, supports_credentials=True)

# Register chatbot blueprint
app.register_blueprint(chatbot_bp)


# =======================================
# CORS HEADERS FIX (NO HARDCODED DOMAINS)
# =======================================
@app.after_request
def apply_cors(response):
    allowed_origins = [
        "http://localhost:5173",                     # Dev Frontend
        "http://localhost:3000",                     # Alt Dev Frontend
        os.getenv("PRODUCTION_FRONTEND_URL", ""),    # Example: https://velocitixai.vercel.app
        os.getenv("PRODUCTION_BACKEND_URL", ""),     # Node backend hosted on Render
    ]

    req_origin = request.headers.get("Origin")
    if req_origin in allowed_origins:
        response.headers["Access-Control-Allow-Origin"] = req_origin

    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS"

    return response


@app.route('/<path:path>', methods=['OPTIONS'])
def options_handler(path):
    return '', 204


# =========================
# UTILITY FUNCTIONS
# =========================

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
        whisper_model = whisper.load_model("base")
        result = whisper_model.transcribe(audio_path, verbose=False)
        return [
            {"start": seg["start"], "end": seg["end"], "text": seg["text"].strip()}
            for seg in result.get("segments", [])
        ]
    except Exception as e:
        print(f"[Whisper Error]: {e}")
        return None


def save_transcript(course_id, lesson_id, video_id, transcript):
    client = MongoClient(MONGO_CONN)
    try:
        db = client.get_default_database()
        if db is None:
            db = client["test"]
    except:
        db = client["test"]
    
    # Ensure IDs are ObjectIds for Mongoose compatibility
    c_id = ObjectId(course_id) if isinstance(course_id, str) else course_id
    l_id = ObjectId(lesson_id) if isinstance(lesson_id, str) else lesson_id

    db["transcripts"].update_one(
        {"lessonId": l_id},
        {"$set": {
            "courseId": c_id,
            "lessonId": l_id,
            "videoId": video_id,
            "transcript": transcript,
        }},
        upsert=True
    )

def find_lesson(video_id):
    client = MongoClient(MONGO_CONN)
    try:
        db = client.get_default_database()
        if db is None:
            db = client["test"]
    except:
        db = client["test"]
    for course in db["courses"].find():
        for week in course.get("weeks", []):
            for module in week.get("modules", []):
                for lesson in module.get("lessons", []):
                    if lesson.get("videoId", "").strip() == video_id:
                        return course, lesson
    return None, None


# =========================
# API ROUTES (NO REMOVALS)
# =========================

@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Velocitix AI Service Running"}), 200


@app.route("/recommend", methods=["POST"])
def recommend():
    data = request.json
    student_id = data.get("student_id")
    refresh = data.get("refresh", False)
    if not student_id:
        return jsonify({"error": "Student ID missing"}), 400
    try:
        return jsonify(recommend_courses(student_id, refresh)), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/analyze-career-video", methods=["POST"])
def analyze_video():
    video_url = request.json.get("video_url")
    print(f"[AI] Received request to analyze video: {video_url}")
    if not video_url:
        return jsonify({"error": "Missing video_url"}), 400
    try:
        results = analyze_career_video(video_url)
        print(f"[AI] Analysis complete for: {video_url}")
        return jsonify(results), 200
    except Exception as e:
        print(f"[AI] Analysis failed: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/generate-transcript", methods=["POST"])
def generate_transcript():
    data = request.json
    video_url = data.get("videoUrl")
    if not video_url:
        return jsonify({"error": "Missing videoUrl"}), 400

    try:
        video_id = extract_youtube_id(video_url).strip()
        set_progress(video_id, 5)

        audio_path = download_audio(video_url)
        if not audio_path:
            set_progress(video_id, 0)
            return jsonify({"error": "Audio download failed"}), 500

        set_progress(video_id, 25)
        transcript = run_whisper(audio_path)
        if not transcript:
            set_progress(video_id, 0)
            return jsonify({"error": "Whisper failed"}), 500

        set_progress(video_id, 80)
        course, lesson = find_lesson(video_id)
        if not course or not lesson:
            return jsonify({"error": "Lesson not found"}), 404

        save_transcript(course["_id"], lesson["_id"], video_id, transcript)
        set_progress(video_id, 100)
        return jsonify({"message": "Transcript saved", "videoId": video_id}), 200

    except Exception as e:
        set_progress(video_id, 0)
        return jsonify({"error": str(e)}), 500


@app.route("/generate-quiz", methods=["POST"])
def generate_quiz_api():
    transcript = request.json.get("transcript")
    if not transcript:
        return jsonify({"error": "Transcript missing"}), 400

    text = " ".join(seg.get("text", "") for seg in transcript) if isinstance(transcript, list) else str(transcript)
    return jsonify(generate_quiz_from_transcript(text)), 200


@app.route("/score-quiz", methods=["POST"])
def score_quiz_api():
    data = request.json
    if not data.get("studentAnswers") or not data.get("originalQuestions"):
        return jsonify({"error": "Missing quiz data"}), 400
    return jsonify(score_quiz_with_ai(data["studentAnswers"], data["originalQuestions"])), 200


@app.route("/progress/<lesson_id>", methods=["GET"])
def get_progress_api(lesson_id):
    return jsonify({"progress": get_progress(lesson_id)}), 200


@app.route("/generate-next-question", methods=["POST"])
def next_question_api():
    try:
        data = request.json
        answer = (data.get("previousAnswer") or "").strip()
        transcript = (data.get("transcript") or "").strip()
        student_id = data.get("studentId")
        proficiency = data.get("proficiency", "Beginner")
        course_id = data.get("courseId")
        is_skipped = data.get("skip", False)
        timedOut = data.get("timedOut", False)

        client = MongoClient(MONGO_CONN)
        db = client["auth_db"]
        sessions = db["interviewsessions"]
        courses = db["courses"]

        session = sessions.find_one({"student": ObjectId(student_id), "course": ObjectId(course_id)})

        if not session:
            sessions.insert_one({
                "student": ObjectId(student_id),
                "course": ObjectId(course_id),
                "questions": [],
                "answers": [],
                "skippedQuestions": [],
                "notAttemptedQuestions": [],
                "timestamps": [],
                "status": "in-progress",
                "lastGeneratedQuestion": {"index": 0, "question": ""}
            })
            session = sessions.find_one({"student": ObjectId(student_id), "course": ObjectId(course_id)})

        if is_skipped and not answer:
            answer = "Skipped"
        elif timedOut:
            answer = "Timed out"

        course = courses.find_one({"_id": ObjectId(course_id)})
        if not course:
            return jsonify({"error": "Course not found"}), 404

        skills = course.get("skillsCovered", [])[:8]
        ideal_roles = course.get("idealRoles", [])[:5]
        lessons = [
            lesson.get("title", "")
            for week in course.get("weeks", [])
            for module in week.get("modules", [])
            for lesson in module.get("lessons", [])
        ][:10]

        used = set(
            q.get("question", "").strip()
            for arr in ["questions", "notAttemptedQuestions", "skippedQuestions", "answers"]
            for q in session.get(arr, [])
        )

        current_index = session.get("lastGeneratedQuestion", {}).get("index", 0)
        for _ in range(3):
            res = generate_next_question(
                answer,
                current_index,
                transcript,
                proficiency,
                course.get("title", "Course"),
                skills,
                lessons,
                ideal_roles,
            )
            nq = res.get("nextQuestion", "").strip()
            if nq and nq not in used:
                sessions.update_one(
                    {"_id": session["_id"]},
                    {"$set": {"lastGeneratedQuestion": {"index": current_index + 1, "question": nq}}}
                )
                return jsonify({"nextQuestion": nq})

        return jsonify({"error": "AI failed to generate unique question"}), 409

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/check-frame", methods=["POST"])
def detect_cheating_api():
    file = request.files.get("frame")
    session_id = request.form.get("sessionId") or request.args.get("sessionId") or "default"
    if not file:
        return jsonify({"error": "No frame uploaded"}), 400
    return jsonify(check_cheating(file.read(), session_id)), 200


@app.route("/cheating-session/reset", methods=["POST"])
def reset_cheating_session_api():
    session_id = (request.json or {}).get("sessionId", "default")
    clear_session(session_id)
    return jsonify({"ok": True}), 200


@app.route("/analyze-session", methods=["POST"])
def final_interview_analysis_api():
    try:
        data = request.json
        video_url = data.get("videoUrl")
        student_id = data.get("studentId")
        answers = data.get("answers", [])

        if not video_url or not student_id:
            return jsonify({"error": "Missing videoUrl or studentId"}), 400

        print(f"[PY] Running interview analysis for student={student_id}")
        return jsonify(analyze_interview(video_url, answers, student_id)), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/reset/<session_id>", methods=["POST"])
def reset_session_api(session_id):
    clear_session(session_id)
    return jsonify({"status": "ok"}), 200


@app.route("/initial-question/<student_id>", methods=["GET"])
def initial_question_api(student_id):
    try:
        client = MongoClient(MONGO_CONN)
        try:
            db = client.get_default_database()
            if db is None:
                db = client["test"]
        except:
            db = client["test"]

        course_id_str = request.args.get("courseId")
        if not course_id_str:
            return jsonify({"error": "CourseId missing"}), 400

        course_id = ObjectId(course_id_str)

        student = db["students"].find_one({"user": ObjectId(student_id)})
        if not student:
            return jsonify({"error": "Student not found"}), 404

        course = db["courses"].find_one({"_id": course_id})
        if not course:
            return jsonify({"error": "Course not found"}), 404

        course_title = course.get("title", "Course")
        skills = course.get("skillsCovered", [])
        lessons = [lesson.get("title", "")
                   for week in course.get("weeks", [])
                   for module in week.get("modules", [])
                   for lesson in module.get("lessons", [])]

        career_data = db["careerassessments"].find_one({"userId": student_id})
        domain = career_data.get("domain", "Technology") if career_data else "Technology"
        proficiency = career_data.get("corrected_level", "Beginner") if career_data else "Beginner"

        prompt = f"""
        The student completed the course "{course_title}".
        Domain: {domain}
        Proficiency: {proficiency}
        Skills: {skills[:8]}
        Lessons: {lessons[:8]}
        Generate the first mock interview question (just the question text).
        """

        res = model.generate_content(prompt)
        question = res.text.strip()

        db["interviewsessions"].update_one(
            {"student": ObjectId(student_id), "course": ObjectId(course_id)},
            {"$set": {
                "course": ObjectId(course_id),
                "questions": [{"index": 0, "question": question}],
                "answers": [],
                "skippedQuestions": [],
                "notAttemptedQuestions": [],
                "lastGeneratedQuestion": {"index": 0, "question": question},
                "status": "in-progress",
            }},
            upsert=True
        )

        return jsonify({"question": question}), 200

    except Exception as e:
        return jsonify({"error": "Failed to generate question"}), 500


# === AI SUGGEST COURSE METADATA ENDPOINT ===
@app.route("/suggest-course-metadata", methods=["POST"])
def suggest_course_metadata():
    data = request.json
    title = data.get("title", "").strip()
    description = data.get("description", "").strip()
    if not title or not description:
        return jsonify({"error": "Title and description are required."}), 400

    # Example prompt for Gemini (adjust as needed)
    prompt = f"""
    Given the following course title and description, suggest:
    - The most relevant domain (from: Technology and Innovation, Healthcare and Wellness, Business and Finance, Arts and Creativity, Education and Social Services)
    - 3-5 ideal roles this course prepares for
    - 5-8 key skills covered
    - 3-5 main challenges addressed
    
    Title: {title}
    Description: {description}
    
    Respond as JSON with keys: domain, idealRoles, skillsCovered, challengesAddressed.
    """
    try:
        res = model.generate_content(prompt)
        # Try to parse the response as JSON
        import json
        try:
            result = json.loads(res.text)
        except Exception:
            # Fallback: try to extract JSON from text
            import re
            match = re.search(r'\{.*\}', res.text, re.DOTALL)
            if match:
                result = json.loads(match.group(0))
            else:
                return jsonify({"error": "AI did not return valid JSON."}), 500
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =====================================
#  START SERVER (RENDER COMPATIBLE)
# =====================================
if __name__ == "__main__":
    PORT = int(os.getenv("AI_PORT", 5000))
    app.run(host="0.0.0.0", port=PORT)
