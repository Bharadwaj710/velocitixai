import os
import re
import json
from bson import ObjectId
from pymongo import MongoClient
from dotenv import load_dotenv
import google.generativeai as genai
from career_video_analysis import analyze_career_video

# Load .env variables
load_dotenv("../server/.env")

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-1.5-flash")

# MongoDB setup
client = MongoClient(os.getenv("MONGO_CONN"))
db = client["auth_db"]
assessments_col = db["careerassessments"]
courses_col = db["courses"]

CACHE_KEYS = [
    "profile_analysis",
    "video_transcript",
    "video_feedback",
    "eye_contact_percent",
    "recommended_courses",
    "corrected_level"
]

def extract_json(text):
    if not text:
        raise ValueError("Gemini returned empty output.")

    match = re.search(r"(?:json)?\s*(\{.*?\})\s*", text, re.DOTALL)
    return json.loads(match.group(1)) if match else json.loads(text)

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
        return extract_json(response.text.strip())
    except Exception as e:
        raise ValueError(f"Gemini analysis failed: {e}")

def determine_level_from_metrics(confidence, communication, tone):
    """
    Determine proficiency level based on confidence, communication, and tone scores extracted from video feedback.
    """
    # Assign tone score
    if tone in ["confident", "passionate"]:
        tone_score = 10
    elif tone in ["intermediate", "neutral"]:
        tone_score = 7
    elif tone == "hesitant":
        tone_score = 5
    elif tone == "unsure":
        tone_score = 3
    else:
        tone_score = 0

    avg_score = (confidence + communication + tone_score) / 3

    if avg_score >= 8:
        return "Proficient"
    elif avg_score >= 5:
        return "Intermediate"
    else:
        return "Beginner"

def compute_score(course, tags):
    score = 0
    if course.get("level", "").lower() == tags["level"].lower():
        score += 2
    if tags["desiredRole"].lower() in " ".join(course.get("idealRoles", [])).lower():
        score += 2
    if any(skill.lower() in map(str.lower, course.get("skillsCovered", [])) for skill in tags["skills"]):
        score += 2
    if any(ch.lower() in map(str.lower, course.get("challengesAddressed", [])) for ch in tags["challenges"]):
        score += 1
    if any(style.lower() in map(str.lower, course.get("learningStyleFit", [])) for style in tags["preferredLearningStyle"]):
        score += 1
    return score

def extract_video_keywords(feedback: str) -> list:
    lines = feedback.lower().splitlines()
    for line in lines:
        if "keyword" in line:
            keyword_line = line.split(":")[-1] if ":" in line else line
            return [kw.strip().lower() for kw in keyword_line.split(",")]
    return []

def parse_feedback_scores(feedback: str):
    """
    Example feedback:
    Confidence score: 8
    Communication clarity: 7
    Tone: Confident
    """
    confidence = 0
    communication = 0
    tone = ""

    for line in feedback.lower().splitlines():
        if "confidence" in line:
            try:
                confidence = int(re.search(r"\d+", line).group())
            except:
                confidence = 0
        if "communication" in line:
            try:
                communication = int(re.search(r"\d+", line).group())
            except:
                communication = 0
        if "tone" in line:
            tone_match = re.search(r"(confident|passionate|intermediate|neutral|hesitant|unsure)", line)
            if tone_match:
                tone = tone_match.group()

    return confidence, communication, tone

def recommend_courses(student_id: str):
    try:
        user_object_id = ObjectId(student_id)
    except Exception:
        raise ValueError("Invalid student_id format")

    data = assessments_col.find_one({"userId": user_object_id})
    if not data or "answers" not in data:
        raise ValueError("Assessment data not found")

    if all(key in data for key in CACHE_KEYS):
        recommended = data["recommended_courses"]
        for course in recommended:
            if "_id" in course:
                course["_id"] = str(course["_id"])
        return {
            "isProcessed": True,
            "student_id": student_id,
            "profile_analysis": data["profile_analysis"],
            "video_transcript": data["video_transcript"],
            "video_feedback": data["video_feedback"],
            "eye_contact_percent": data["eye_contact_percent"],
            "corrected_level": data["corrected_level"],
            "recommended_courses": recommended
        }

    def get_answer(qn):
        ans = next((a["answer"] for a in data["answers"] if a["questionNumber"] == qn), "")
        return ", ".join(ans) if isinstance(ans, list) else ans

    answers = {f"question{i}": get_answer(i) for i in range(1, 10)}
    tags = analyze_with_gemini(answers)

    video_url = get_answer(10)
    if not video_url:
        raise ValueError("Missing video URL for question 10")

    video_analysis = analyze_career_video(video_url)
    transcript = video_analysis["transcript"]
    feedback = video_analysis["ai_feedback"]
    eye_contact_percent = video_analysis["eye_contact_percent"]

    confidence, communication, tone = parse_feedback_scores(feedback)

    corrected_level = determine_level_from_metrics(confidence, communication, tone)
    tags["level"] = corrected_level

    tags["skills"] = list(set(tags["skills"] + extract_video_keywords(feedback)))

    raw_courses = list(courses_col.find({"domain": {"$regex": tags["domain"], "$options": "i"}}))
    scored_courses = [(course, compute_score(course, tags)) for course in raw_courses]

    # ✅ Lower threshold to recommend more courses
    filtered = [course for course, score in scored_courses if score >= 3]

    if not filtered:
        # ✅ If no course meets threshold, suggest top 3 anyway
        filtered = sorted(raw_courses, key=lambda c: -compute_score(c, tags))[:3]

    recommended = sorted(filtered, key=lambda c: -compute_score(c, tags))

    for course in recommended:
        if "_id" in course:
            course["_id"] = str(course["_id"])

    assessments_col.update_one(
        {"userId": user_object_id},
        {"$set": {
            "profile_analysis": tags,
            "video_transcript": transcript,
            "video_feedback": feedback,
            "eye_contact_percent": eye_contact_percent,
            "corrected_level": corrected_level,
            "recommended_courses": recommended
            "isProcessed": True
        }}
    )

    return {
        "student_id": student_id,
        "profile_analysis": tags,
        "video_transcript": transcript,
        "video_feedback": feedback,
        "eye_contact_percent": eye_contact_percent,
        "corrected_level": corrected_level,
        "recommended_courses": recommended
        "isProcessed": True
    }
