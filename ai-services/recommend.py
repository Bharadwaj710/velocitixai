import os
import google.generativeai as genai
from pymongo import MongoClient
from dotenv import load_dotenv

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
    A student submitted the following career assessment answers:

    Career Interest: {answers['question1']}
    Project: {answers['question2']}
    Ideal Work Environment: {answers['question4']}

    Based on these, return a comma-separated list of 3–5 keywords describing this student's career focus, skills, or learning needs.
    ONLY return keywords. No extra text.
    """

    try:
        response = model.generate_content(prompt)
        tags_text = response.text.strip()
        return [tag.strip().lower() for tag in tags_text.split(",")]
    except Exception as e:
        raise ValueError(f"Gemini analysis failed: {e}")

def recommend_courses(student_id):
    from bson import ObjectId
    data = assessments_col.find_one({"user": ObjectId(student_id)})

    if not data:
        raise ValueError("Assessment not found")

    answers = {
        "question1": data.get("question1", ""),
        "question2": data.get("question2", ""),
        "question4": data.get("question4", "")
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
