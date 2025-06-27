from flask import Flask, request, jsonify
import os
import google.generativeai as genai
from dotenv import load_dotenv
from pymongo import MongoClient
from bson import ObjectId

# Load environment variables
load_dotenv("../server/.env")

app = Flask(__name__)

# MongoDB connection
MONGO_CONN = os.getenv("MONGO_CONN")
client = MongoClient(MONGO_CONN)
db = client["auth_db"]
students_col = db.students
assessments_col = db.careerassessments

# Gemini setup
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-1.5-flash")

# Utility to convert ObjectId to string
def clean_id(doc):
    if isinstance(doc, list):
        return [clean_id(d) for d in doc]
    if isinstance(doc, dict):
        return {k: clean_id(v) for k, v in doc.items()}
    if isinstance(doc, ObjectId):
        return str(doc)
    return doc

@app.route("/generate", methods=["POST"])
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

        # Format answers
        answers_text = "\n".join([
            f"{a['questionText']} — {a['answer']}" for a in assessment.get("answers", [])
        ])

        # Format courses
        recommended_courses = assessment.get("recommended_courses", [])
        courses_text = "\n\n".join([
            f"- {c['title']}: {c['description']}" for c in recommended_courses
        ])

        # Format chat history
        chat_history = "\n".join([
            f"User: {m['text']}" if m['sender'] == "user" else f"AI: {m['text']}" for m in messages
        ])

        # Tone instruction based on proficiency level
        level = assessment.get("corrected_level", "Intermediate")
        if level == "Beginner":
            tone_instruction = "Use simple language and clear explanations. Avoid technical jargon. Be encouraging."
        elif level == "Advanced":
            tone_instruction = "Use technical terms. Provide in-depth insights. Be concise and professional."
        else:
            tone_instruction = "Use a balanced tone. Explain concepts with moderate depth. Be practical and helpful."

        # Construct the Gemini prompt
        prompt = f"""
You are a AI tutor chatbot helping students clear their doubts in the subject or any general questions.

Student Info:
Name: {student.get("name", "N/A")}
Branch: {student.get("branch", "N/A")}
College: {student.get("college", "N/A")}
Year: {student.get("yearOfStudy", "N/A")}
Address: {student.get("address", "N/A")}

Assessment Summary:
Domain: {assessment.get("domain", "N/A")}
Level: {assessment.get("corrected_level", "N/A")}
Answers:
{answers_text}

Video Feedback: {assessment.get("video_feedback", "")}
Skills: {', '.join(assessment.get('profile_analysis', {}).get('skills', []))}

Recommended Courses:
{courses_text}

Chat History:
{chat_history}

Reply concisely and helpfully. Keep the answers very short(2-3 lines) unless it's neccessary.
        """

        response = model.generate_content(prompt)
        reply = response.text.strip()

        return jsonify({ "reply": reply })

    except Exception as e:
        print("Error:", e)
        return jsonify({ "reply": "Sorry, an error occurred processing your request." }), 200

if __name__ == "__main__":
    app.run(debug=True, port=5002)
