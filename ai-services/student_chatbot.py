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
model = genai.GenerativeModel("gemini-2.5-flash")

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

        student_doc = students_col.find_one({"user": user_obj_id})
        assessment_doc = assessments_col.find_one({"userId": user_obj_id})
        course_doc = courses_col.find_one({"_id": course_obj_id})

        if not student_doc or not assessment_doc or not course_doc:
            return jsonify({"reply": "Student data not found"}), 404

        student = clean_id(student_doc)
        assessment = clean_id(assessment_doc)
        course = clean_id(course_doc)

        student_name = student.get("name", "Student")
        level = assessment.get("corrected_level", "Intermediate")
        domain = assessment.get("domain", "N/A")
        skills = ', '.join(assessment.get("profile_analysis", {}).get("skills", []))

        title = course.get("title", "N/A")
        description = course.get("description", "No description provided.")
        skills_covered = ', '.join(course.get("skillsCovered", []))
        challenges = ', '.join(course.get("challengesAddressed", []))

        module_titles = []
        for week in course.get("weeks", []):
            for module in week.get("modules", []):
                module_titles.append(module.get("title", "Untitled Module"))

        modules_formatted = "\n".join(f"• {mod}" for mod in module_titles)

        course_summary = f"""
**Course Title:** {title}  
**Description:** {description}  
**Skills Covered:** {skills_covered or 'N/A'}  
**Challenges Addressed:** {challenges or 'N/A'}  
**Modules:**  
{modules_formatted or 'No modules found.'}
""".strip()

        chat_history = "\n".join([
            f"**User:** {m['text']}" if m["sender"] == "user" else f"**AI:** {m['text']}"
            for m in messages[-10:]
        ])

        if level == "Beginner":
            tone = "Use simple, friendly language. Avoid jargon."
        elif level == "Advanced":
            tone = "Use clear and concise technical language."
        else:
            tone = "Use practical language with a moderately technical tone."

        prompt = f"""
You are an expert AI tutor helping a student understand their course.

### Student Info
• **Name:** {student_name}  
• **Level:** {level}  
• **Domain:** {domain}  
• **Skills:** {skills or 'Not available'}  

### Course Summary
{course_summary}

### Rules:
- Only answer questions **related to this course**.
- If the user asks something off-topic, respond:
  _"I'm here to help with this course only. Please ask something related to it."_
- If the user asks multiple related questions at once, try to answer each part briefly in the same response.

### Style Instructions:
- {tone}
- When the question includes multiple topics or asks for detailed explanation, split the answer into **clear sections** with proper headings using `**Bold**` titles.
- First explain the broader concept (e.g., CSS) before diving into subtopics (e.g., Classes and IDs).
- Use bullet points (`•`) **within** each section, not across different topics.
- Always answer in clear, concise bullet points using dot (•) format.
- Start each main point with a dot (•), not dashes or numbers.
- If there are multiple related sub-questions, break your answer into clear bullet points for each.
- Keep each point short — ideally 1–2 lines.
- Do not write paragraphs unless the user explicitly asks for detailed explanation.
- Always use proper markdown for formatting:
  - Use `**` for bold text.
  - Use `•` or `-` for bullet points (with line breaks).
  - Use triple backticks ``` for code blocks if needed.

### Recent Chat:
{chat_history}

Respond to the student's latest query:
""".strip()

        response = model.generate_content(prompt)
        reply = response.text.strip()

        return jsonify({ "reply": reply })

    except Exception as e:
        print("Error:", e)
        return jsonify({"reply": "Sorry, an error occurred while processing your request."}), 500


@chatbot_bp.route("/suggestions", methods=["POST"])
def suggest_questions():
    try:
        data = request.get_json()
        user_id = data.get("userId")
        course_id = data.get("courseId")

        if not user_id or not course_id:
            return jsonify({"error": "Missing userId or courseId"}), 400

        obj_id = ObjectId(user_id)
        course_obj_id = ObjectId(course_id)

        student = students_col.find_one({"user": obj_id})
        assessment = assessments_col.find_one({"userId": obj_id})
        course = courses_col.find_one({"_id": course_obj_id})

        if not student or not assessment or not course:
            return jsonify({"error": "Data not found"}), 404

        course_title = course.get("title", "")
        course_desc = course.get("description", "")
        modules = [mod["title"] for week in course.get("weeks", []) for mod in week.get("modules", [])]
        modules_text = ", ".join(modules[:5])

        prompt = f"""
You are a course assistant for the course: **{course_title}**

Based on the course description and modules, generate 3–5 short **starter questions** a student might ask.

### Course Overview
**Description:** {course_desc}  
**Modules:** {modules_text}

Return the questions as a clean bullet list using `•`. Do not include any explanation or intro.
"""

        response = model.generate_content(prompt)
        raw = response.text.strip().split("\n")
        questions = [q.lstrip("-•* ").strip() for q in raw if q.strip()]

        return jsonify({ "questions": questions[:5] })

    except Exception as e:
        print("Suggestion error:", e)
        return jsonify({ "questions": [] }), 200
