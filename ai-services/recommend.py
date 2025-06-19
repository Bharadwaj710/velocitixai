import os
import google.generativeai as genai
from pymongo import MongoClient
from dotenv import load_dotenv
from bson import ObjectId

load_dotenv(dotenv_path="../server/.env")

# Setup Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-1.5-flash")  # Free and fast model

# MongoDB Setup
client = MongoClient(os.getenv("MONGO_CONN"))
db = client["auth_db"]
assessments_col = db["careerassessments"]
courses_col = db["courses"]

def analyze_with_gemini(answers: dict) -> list:
    prompt = f"""
    A student has submitted the following responses in a career assessment form.
    Use these answers to infer 3–5 career-related keywords describing the student's domain interests, skills, learning preferences, and career goals.

    Do NOT include any introduction or explanation — only return a comma-separated list of keywords.

    Career Interest (Q1): {answers['question1']}
    Skill Rating / Domain Self-Assessment (Q2): {answers['question2']}
    Tools / Areas Worked With (Q3): {answers['question3']}
    Project Description / Intent (Q4): {answers['question4']}
    Subfields of Interest (Q5): {answers['question5']}
    Learning Preference (Q6): {answers['question6']}
    Desired Role (Q7): {answers['question7']}
    Challenges Faced (Q8): {answers['question8']}
    Weekly Availability (Q9): {answers['question9']}
    """

    try:
        response = model.generate_content(prompt)
        tags_text = response.text.strip()
        return [tag.strip().lower() for tag in tags_text.split(",") if tag.strip()]
    except Exception as e:
        raise ValueError(f"Gemini analysis failed: {e}")

def recommend_courses(student_id: str):
    try:
        user_object_id = ObjectId(student_id)
    except:
        raise ValueError("Invalid student_id format")

    data = assessments_col.find_one({"userId": user_object_id})
    if not data or "answers" not in data:
        raise ValueError("Assessment not found or invalid format")

    # Helper to extract answer by questionNumber
    def get_answer(qn):
        result = next((a["answer"] for a in data["answers"] if a["questionNumber"] == qn), "")
        if isinstance(result, list):
            return ", ".join(result)
        return result

    answers = {
        f"question{i}": get_answer(i) for i in range(1, 10)  # Q1 to Q9
    }

    tags = analyze_with_gemini(answers)

    # Match courses based on tags
    query = {
        "$or": [
            {"title": {"$regex": "|".join(tags), "$options": "i"}},
            {"description": {"$regex": "|".join(tags), "$options": "i"}},
            {"modules.title": {"$regex": "|".join(tags), "$options": "i"}}
        ]
    }

    courses = list(courses_col.find(query, {"_id": 0}))
    return {
        "student_id": student_id,
        "tags": tags,
        "recommended_courses": courses
    }
