import os
import re
import json
import google.generativeai as genai
from pymongo import MongoClient
from dotenv import load_dotenv
from bson import ObjectId

# Load environment variables
load_dotenv(dotenv_path="../server/.env")

# Setup Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-1.5-flash")  # Free and fast

# MongoDB setup
client = MongoClient(os.getenv("MONGO_CONN"))
db = client["auth_db"]
assessments_col = db["careerassessments"]
courses_col = db["courses"]

# Extract valid JSON from raw Gemini output
def extract_json(text):
    if not text:
        raise ValueError("Gemini returned empty output.")

    match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if match:
        return json.loads(match.group(1))  # JSON inside ``` block
    return json.loads(text)  # Raw JSON (if valid)

# Analyze student answers using Gemini
def analyze_with_gemini(answers: dict) -> dict:
    prompt = f"""
    A student has submitted the following responses in a career assessment form.
    Analyze the student's domain interest, skill level, relevant tools or experience, career goals, learning preferences, and knowledge gaps.

    Return a structured JSON object with the following keys:
    - domain: single keyword (e.g., "Technology", "Healthcare")
    - level: one of ["Beginner", "Intermediate", "Proficient"]
    - skills: list of 3–5 technical or domain-related keywords
    - preferredLearningStyle: list of 1–2 keywords (e.g., "Videos", "Case studies", "Hands-on projects")
    - desiredRole: short string (e.g., "Frontend Developer", "Counselor")
    - challenges: list of 1–2 keywords (e.g., "Confidence", "Field exposure")

    Respond ONLY with JSON like this:
    {{
      "domain": "Technology",
      "level": "Beginner",
      "skills": ["Python", "HTML", "CSS"],
      "preferredLearningStyle": ["Videos", "Hands-on projects"],
      "desiredRole": "Frontend Developer",
      "challenges": ["Syntax errors", "Lack of experience"]
    }}

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
        output = response.text.strip()
        print("🔍 Gemini Output:\n", output)
        return extract_json(output)
    except Exception as e:
        raise ValueError(f"Gemini analysis failed or returned invalid JSON: {e}")

# Score a course based on matching fields
def compute_score(course, tags):
    score = 0

    # Exact domain match already applied in DB query

    # Level match
    if course.get("level", "").lower() == tags["level"].lower():
        score += 2

    # Role match
    if tags["desiredRole"].lower() in " ".join(course.get("idealRoles", [])).lower():
        score += 2

    # Skill overlap
    if any(skill.lower() in [s.lower() for s in course.get("skillsCovered", [])] for skill in tags["skills"]):
        score += 2

    # Challenge match
    if any(ch.lower() in [c.lower() for c in course.get("challengesAddressed", [])] for ch in tags["challenges"]):
        score += 1

    # Learning style match
    if any(style.lower() in [s.lower() for s in course.get("learningStyleFit", [])] for style in tags["preferredLearningStyle"]):
        score += 1

    return score

# Recommend courses
def recommend_courses(student_id: str):
    try:
        user_object_id = ObjectId(student_id)
    except:
        raise ValueError("Invalid student_id format")

    data = assessments_col.find_one({"userId": user_object_id})
    if not data or "answers" not in data:
        raise ValueError("Assessment not found or invalid format")

    # ✅ Return cached result if already available
    if "profile_analysis" in data and "recommended_courses" in data:
        return {
            "student_id": student_id,
            "profile_analysis": data["profile_analysis"],
            "recommended_courses": data["recommended_courses"]
        }

    # Extract Q1 to Q9
    def get_answer(qn):
        result = next((a["answer"] for a in data["answers"] if a["questionNumber"] == qn), "")
        if isinstance(result, list):
            return ", ".join(result)
        return result

    answers = {
        f"question{i}": get_answer(i) for i in range(1, 10)
    }

    # Analyze using Gemini
    tags = analyze_with_gemini(answers)

    # Step 1: Find all courses from the same domain
    raw_courses = list(courses_col.find(
        {"domain": {"$regex": tags["domain"], "$options": "i"}},
        {"_id": 0}
    ))

    # Step 2: Score each course
    scored_courses = [(course, compute_score(course, tags)) for course in raw_courses]

    # Step 3: Filter and sort
    filtered = [c for c, s in scored_courses if s >= 4]
    recommended = sorted(filtered, key=lambda c: -compute_score(c, tags))

    # ✅ Cache the results in MongoDB
    assessments_col.update_one(
        {"userId": user_object_id},
        {"$set": {
            "profile_analysis": tags,
            "recommended_courses": recommended
        }}
    )

    return {
        "student_id": student_id,
        "profile_analysis": tags,
        "recommended_courses": recommended
    }

