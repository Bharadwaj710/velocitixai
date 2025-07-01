from flask import Blueprint, request, jsonify
import os
import google.generativeai as genai
from dotenv import load_dotenv
from pymongo import MongoClient
from bson import ObjectId

# Load environment variables
load_dotenv("../server/.env")

chatbot_bp = Blueprint("chatbot", __name__)

# MongoDB setup
MONGO_CONN = os.getenv("MONGO_CONN")
client = MongoClient(MONGO_CONN)
db = client["auth_db"]
students_col = db.students
assessments_col = db.careerassessments
courses_col = db.courses

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
        course_id = data.get("courseId")
        messages = data.get("messages", [])

        if not user_id or not course_id:
            return jsonify({"reply": "Missing userId or courseId"}), 400

        try:
            user_obj_id = ObjectId(user_id)
            course_obj_id = ObjectId(course_id)
        except Exception:
            return jsonify({"reply": "Invalid userId or courseId"}), 400

        # Fetch student and assessment documents
        student_doc = students_col.find_one({"user": user_obj_id})
        assessment_doc = assessments_col.find_one({"userId": user_obj_id})

        if not student_doc or not assessment_doc:
            return jsonify({"reply": "Student data not found"}), 404

        # Fetch course document
        course_doc = courses_col.find_one({"_id": course_obj_id})
        if not course_doc:
            print("Course not found for courseId:", course_id)
            return jsonify({"reply": "Sorry, the course information couldn't be loaded. Please try again later."}), 404

        # Clean MongoDB ObjectIds
        student = clean_id(student_doc)
        assessment = clean_id(assessment_doc)
        course = clean_id(course_doc)

        # Extract key info
        student_name = student.get("name", "Student")
        level = assessment.get("corrected_level", "Intermediate")
        domain = assessment.get("domain", "N/A")
        skills = ', '.join(assessment.get("profile_analysis", {}).get("skills", []))

        # Extract course summary
        title = course.get("title", "N/A")
        description = course.get("description", "No description provided.")
        skills_covered = ', '.join(course.get("skillsCovered", []))
        challenges = ', '.join(course.get("challengesAddressed", []))

        module_titles = []
        for week in course.get("weeks", []):
            for module in week.get("modules", []):
                module_titles.append(module.get("title", "Untitled Module"))

        modules_formatted = "\n".join(f"  • {mod}" for mod in module_titles)

        course_summary = f"""
Course Title: {title}
Description: {description}
Skills Covered: {skills_covered or 'N/A'}
Challenges Addressed: {challenges or 'N/A'}
Modules:
{modules_formatted or 'No modules found.'}
""".strip()

        # Prepare chat history
        chat_history = "\n".join([
            f"User: {m['text']}" if m["sender"] == "user" else f"AI: {m['text']}"
            for m in messages[-10:]
        ])

        # Define tone based on level
        if level == "Beginner":
            tone = "Use simple language. Avoid jargon. Be friendly and encouraging."
        elif level == "Advanced":
            tone = "Use technical terms. Be concise, clear, and in-depth."
        else:
            tone = "Use moderately technical language. Keep it practical and clear."

        # Gemini prompt
        prompt = f"""
You are a highly focused AI tutor chatbot.

The student is currently learning this course:

{course_summary}

✅ Only answer questions directly related to this course.  
❌ If a question is unrelated (e.g., about another domain), reply politely:
"I'm here to help with this course only. Please ask something related to it."

Student Name: {student_name}
Proficiency Level: {level}
Domain: {domain}
Student Skills: {skills or 'Not available'}

Recent Conversation:
{chat_history}

Instructions:
- {tone}
- Prefer short bullet points or numbered lists if an explanation is needed.
- Keep answers 2–3 lines max unless detailed clarification is explicitly asked.
- Never answer personal, off-topic, or unrelated queries.
""".strip()

        # Generate response
        response = model.generate_content(prompt)
        reply = response.text.strip()

        return jsonify({"reply": reply})

    except Exception as e:
        print("Error:", e)
        return jsonify({"reply": "Sorry, an error occurred while processing your request."}), 500
