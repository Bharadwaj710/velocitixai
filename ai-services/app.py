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
from live_cheating_detector import check_cheating
from generate_next_question import generate_next_question
from utils.progress_tracker import set_progress, get_progress
from bson.objectid import ObjectId

# --- Load environment variables ---
load_dotenv("../server/.env")
MONGO_CONN = os.getenv("MONGO_CONN")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# --- Configure Gemini ---
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-1.5-flash")

# --- Initialize Flask ---
app = Flask(__name__)
CORS(app)
app.register_blueprint(chatbot_bp)

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

# === Utility Functions ===

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
            {"start": seg["start"], "end": seg["end"], "text": seg["text"].strip()}
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
        {"$set": {
            "courseId": course_id,
            "lessonId": lesson_id,
            "videoId": video_id,
            "transcript": transcript,
        }},
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

# === Core Routes ===

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

@app.route("/generate-transcript", methods=["POST"])
def generate_transcript():
    data = request.get_json()
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
def generate_quiz():
    data = request.get_json()
    transcript = data.get("transcript")
    if not transcript:
        return jsonify({"error": "Transcript is required"}), 400

    if isinstance(transcript, list):
        full_text = " ".join(seg.get("text", "") for seg in transcript)
    else:
        full_text = str(transcript)

    quiz = generate_quiz_from_transcript(full_text)
    return jsonify(quiz), 200

@app.route("/score-quiz", methods=["POST"])
def score_quiz():
    try:
        data = request.get_json()
        student_answers = data.get("studentAnswers", [])
        original_questions = data.get("originalQuestions", [])
        if not student_answers or not original_questions:
            return jsonify({"error": "Missing data"}), 400

        result = score_quiz_with_ai(student_answers, original_questions)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": "Failed to score quiz"}), 500

@app.route("/progress/<lesson_id>", methods=["GET"])
def get_progress_for_lesson(lesson_id):
    return jsonify({ "progress": get_progress(lesson_id) })

# === 🧠 AI INTERVIEW MODULE ===

from pymongo import MongoClient

@app.route("/generate-next-question", methods=["POST"])
def get_next_question():
    data = request.get_json()
    answer = data.get("previousAnswer", "")
    transcript = data.get("transcript", "")
    student_id = data.get("studentId")
    proficiency = data.get("proficiency", "Beginner")
    course_id = data.get("courseId")
    is_skipped = data.get("skip", False)
    timedOut = data.get("timedOut", False)

    try:
        client = MongoClient(MONGO_CONN)
        db = client["auth_db"]
        sessions = db["interviews"]

        session = sessions.find_one({"student": ObjectId(student_id)})
        if not session:
            sessions.insert_one({
                "student": ObjectId(student_id),
                "questions": [],
                "answers": [],
                "skippedQuestions": [],
                "notAttemptedQuestions": [],
                "timestamps": [],
                "status": "in-progress",
                "lastGeneratedQuestion": {"index": 0, "question": ""}
            })
            session = sessions.find_one({"student": ObjectId(student_id)})

        last_q = session.get("lastGeneratedQuestion", {})
        current_index = last_q.get("index", 0)
        current_question_text = last_q.get("question", "")

        # ✅ Only if timedOut, push lastGeneratedQuestion to notAttempted (if not answered)
        if timedOut and current_question_text:
            existing_answer = session.get("answers", [])
            alreadyAnswered=any(
                isinstance(a, dict) and
                a.get("index") == current_index and a.get("answer", "").strip()
                for a in session.get("answers", [])
            )
            if not alreadyAnswered:
                already_na = any(q.get("index") == current_index for q in session.get("notAttemptedQuestions", []))
                if not already_na:
                    sessions.update_one(
                        {"student": ObjectId(student_id)},
                        {
                        "$push": {"notAttemptedQuestions": {"index": current_index, "question": current_question_text}}}
                    )

        if is_skipped and not answer.strip():
            answer = "Skipped"
        elif timedOut:
            answer = "Timed out"

        course = db["courses"].find_one({"_id": ObjectId(course_id)})
        if not course:
            return jsonify({"error": "Course not found"}), 404

        skills = course.get("skillsCovered", [])
        ideal_roles = course.get("idealRoles", [])
        lesson_titles = [
            lesson.get("title", "")
            for week in course.get("weeks", [])
            for module in week.get("modules", [])
            for lesson in module.get("lessons", [])
        ]

        result = generate_next_question(
            answer.strip(),
            current_index,
            transcript,
            proficiency,
            course.get("title", "Course"),
            skills,
            lesson_titles,
            ideal_roles,
        )

        next_question = result.get("nextQuestion")
        if not next_question:
            return jsonify({"error": "AI failed to generate a question"}), 400
        next_index = int(current_index) + 1

        sessions.update_one(
            {"student": ObjectId(student_id)},
            {
                "$addToSet": {"questions": {"index": next_index, "question": next_question}},
                "$set": {"lastGeneratedQuestion": {"index": next_index, "question": next_question}}
            }
        )

        return jsonify({"nextQuestion": next_question})
    except Exception as e:
        print("❌ Error in /generate-next-question:", str(e))
        return jsonify({"error": str(e)}), 500

@app.route("/check-frame", methods=["POST"])
def detect_cheating():
    file = request.files.get("frame")
    if not file:
        return jsonify({"error": "No frame uploaded"}), 400
    try:
        result = check_cheating(file.read())
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/analyze-session", methods=["POST"])
def final_interview_analysis():
    try:
        data = request.get_json()
        video_url = data.get("videoUrl")
        answers = data.get("answers", [])
        timestamps = data.get("timestamps", [])
        report = analyze_interview(video_url, answers, timestamps)
        return jsonify(report)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/initial-question/<student_id>", methods=["GET"])
def generate_initial_question(student_id):
    try:
        print("➡️  /initial-question hit with ID:", student_id)

        # === Setup DB ===
        client = MongoClient(MONGO_CONN)
        db = client["auth_db"]

        # === Get Course ID from Query ===
        course_id_str = request.args.get("courseId")
        if not course_id_str:
            return jsonify({ "error": "Course ID is required in query param" }), 400

        try:
            course_id = ObjectId(course_id_str)
        except:
            return jsonify({ "error": "Invalid course ID" }), 400

        # === Get Student ===
        student = db["students"].find_one({ "user": ObjectId(student_id) })
        if not student:
            print("❌ Student not found in 'students'")
            return jsonify({ "error": "Student not found" }), 404

        # === Get Course ===
        course = db["courses"].find_one({ "_id": course_id })
        if not course:
            print("❌ Course not found in 'courses'")
            return jsonify({ "error": "Course not found" }), 404

        course_title = course.get("title", "Unnamed Course")
        skills = course.get("skillsCovered", [])
        ideal_roles = course.get("idealRoles", [])
        lesson_titles = []
        for week in course.get("weeks", []):
            for module in week.get("modules", []):
                for lesson in module.get("lessons", []):
                    lesson_titles.append(lesson.get("title", ""))

        # === Get Proficiency and Domain from Career Assessment ===
        career_data = db["careerassessments"].find_one({ "userId": student_id })
        domain = career_data.get("domain", "Technology") if career_data else "Technology"
        proficiency = career_data.get("corrected_level", "Beginner") if career_data else "Beginner"

        # === Gemini Prompt Construction ===
        skills_str = "\n".join(f"- {s}" for s in skills[:8])
        lessons_str = "\n".join(f"- {l}" for l in lesson_titles[:8])
        roles_str = ", ".join(ideal_roles[:5])

        prompt = f"""
        You are an AI interviewer conducting a mock interview for a student.

        The student has completed the course: "{course_title}"
        Domain: "{domain}"
        Proficiency: "{proficiency}"
        Ideal roles: {roles_str}

        The course covers these skills:
        {skills_str}

        The course includes the following lesson topics:
        {lessons_str}

        Based on this, generate the **first mock interview question** tailored to test the student's applied understanding. Be clear and direct.

        ONLY return the question.
        """

        print("📨 Prompt:\n", prompt)
        response = model.generate_content(prompt)
        print("✅ Gemini Response:", response.text.strip())
        question = response.text.strip()
        
        db["interviews"].update_one(
            { "student": ObjectId(student_id) },
            {
                "$set": {
                    "questions": [{ "index": 0, "question": question }],
                    "answers": [""],
                    "skippedQuestions": [],
                    "notAttemptedQuestions": [],
                    "lastGeneratedQuestion": { "index": 0, "question": question },
                    "status": "in-progress",
            }
            },
            upsert=True
        )
        return jsonify({ "question": response.text.strip() })

    except Exception as e:
        print("❌ Exception occurred:", str(e))
        return jsonify({ "error": "Failed to generate initial question" }), 500

# === Run the Flask App ===

if __name__ == "__main__":
    app.run(port=5001, debug=True)
