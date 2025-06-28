from flask import Blueprint, request, jsonify
import os
import google.generativeai as genai
from dotenv import load_dotenv
from pymongo import MongoClient
from bson import ObjectId

# Load env vars
load_dotenv("../server/.env")

chatbot_bp = Blueprint("chatbot", __name__)

# MongoDB setup
MONGO_CONN = os.getenv("MONGO_CONN")
client = MongoClient(MONGO_CONN)
db = client["auth_db"]
students_col = db.students
assessments_col = db.careerassessments

# Gemini setup
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-1.5-flash")


def clean_id(doc):
    if isinstance(doc, list):
        return [clean_id(d) for d in doc]
    if isinstance(doc, dict):
        return {k: clean_id(v) for k, v in doc.items()}
    if isinstance(doc, ObjectId):
        return str(doc)
    return doc


@chatbot_bp.route("/generate", methods=["POST"])
def generate():
    try:
        data = request.get_json()
        user_id = data.get("userId")
        messages = data.get("messages", [])

        if not user_id:
            return jsonify({"reply": "Missing user ID"}), 400

        try:
            obj_id = ObjectId(user_id)
        except Exception:
            return jsonify({"reply": "Invalid user ID"}), 400

        student_doc = students_col.find_one({"user": obj_id})
        assessment_doc = assessments_col.find_one({"userId": obj_id})

        if not student_doc or not assessment_doc:
            return jsonify({"reply": "Student data not found"}), 404

        student = clean_id(student_doc)
        assessment = clean_id(assessment_doc)

        # Extract relevant data
        student_name = student.get("name", "Student")
        level = assessment.get("corrected_level", "Intermediate")
        domain = assessment.get("domain", "N/A")
        skills = ', '.join(assessment.get("profile_analysis", {}).get("skills", []))

        # Get registered courses
        registered_courses = assessment.get("recommended_courses", [])
        course_info_text = "\n".join(
            f"- {course['title']}: {course['description']}" for course in registered_courses
        )

        # Tone adjustment
        if level == "Beginner":
            tone = "Use simple language. Avoid jargon. Explain clearly and patiently."
        elif level == "Advanced":
            tone = "Use technical terms. Be concise, precise, and assume strong prior knowledge."
        else:
            tone = "Use moderately technical language. Provide practical and clear explanations."

        # Format messages
        chat_history = "\n".join([
            f"User: {m['text']}" if m["sender"] == "user" else f"AI: {m['text']}"
            for m in messages[-10:]
        ])

        # Prompt
        prompt = f"""
You are an AI tutor chatbot. The student is currently learning the following course(s):

{course_info_text or "No course information found."}

Only respond to queries that are related to the above courses. If the question is not related to these courses, politely ask the student to stick to course-related queries.

Student Name: {student_name}
Level: {level}
Domain: {domain}
Skills: {skills}

Conversation so far:
{chat_history}

Instructions:
- {tone}
- Format responses in short bullet points or numbered lists if explanation is needed.
- Keep answers within 2–3 lines unless a detailed explanation is clearly requested.
- Do NOT answer off-topic or unrelated personal questions.
"""

        response = model.generate_content(prompt)
        reply = response.text.strip()

        return jsonify({"reply": reply})

    except Exception as e:
        print("Error:", e)
        return jsonify({"reply": "Sorry, an error occurred processing your request."}), 500
