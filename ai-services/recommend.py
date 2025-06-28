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
    Analyze the student's domain interest, skill level, relevant tools or experience, career goals, and knowledge gaps.

    Return a structured JSON object with the following keys:
    - domain: keyword (e.g., "Technology and Innovation", "Healthcare and Wellness", "Business and Finance")
    - level: one of ["Beginner", "Intermediate", "Proficient"]
    - skills: list of 3–5 technical or domain-related keywords
    - desiredRole: short string (e.g., "Frontend Developer", "Counselor")
    - challenges: list of 1–2 keywords (e.g., "Confidence", "Field exposure")

    Respond ONLY with JSON like this:
    {{      
      "domain": "Technology and Innovation",
      "level": "Beginner",
      "skills": ["Python", "HTML", "CSS"],
      "desiredRole": "Frontend Developer",
      "challenges": ["Syntax errors", "Lack of experience"]
    }}

    Career Interest (Q1): {answers['question1']}
    Skill Rating / Domain Self-Assessment (Q2): {answers['question2']}
    Tools / Areas Worked With (Q3): {answers['question3']}
    Project Description / Intent (Q4): {answers['question4']}
    Subfields of Interest (Q5): {answers['question5']}
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
    Improved mapping for more accurate results.
    """
    # Normalize scores to 0-10
    confidence = max(0, min(10, confidence))
    communication = max(0, min(10, communication))

    # Assign tone score with more granularity
    tone_map = {
        "confident": 10,
        "passionate": 9,
        "intermediate": 7,
        "neutral": 6,
        "hesitant": 4,
        "unsure": 2
    }
    tone_score = tone_map.get(tone, 0)

    # Weighted average: confidence and communication are more important
    avg_score = (confidence * 0.4) + (communication * 0.4) + (tone_score * 0.2)

    # Adjusted thresholds for better separation
    if avg_score >= 7.5:
        return "Proficient"
    elif avg_score >= 5:
        return "Intermediate"
    else:
        return "Beginner"

def compute_score(course, tags):
    """
    Compute a cumulative match score and label for a course based on:
    - domain match
    - level match
    - role relevance
    - skill overlap
    - challenge relevance
    Returns: (score, label, breakdown_dict)
    """
    score = 0
    breakdown = {}

    # Domain match (exact: 2, partial: 1)
    domain_score = 0
    if course.get("domain", "").lower() == tags.get("domain", "").lower():
        domain_score = 2
    elif tags.get("domain", "").lower() in course.get("domain", "").lower() or course.get("domain", "").lower() in tags.get("domain", "").lower():
        domain_score = 1
    score += domain_score
    breakdown["domain"] = domain_score

    # Level match (exact: 2)
    level_score = 2 if course.get("level", "").lower() == tags.get("level", "").lower() else 0
    score += level_score
    breakdown["level"] = level_score

    # Role relevance (exact: 2, partial: 1)
    role_score = 0
    for role in course.get("idealRoles", []):
        if tags.get("desiredRole", "").lower() in role.lower():
            role_score = 2
            break
        elif tags.get("desiredRole", "").split(" ")[0] in role.lower():
            role_score = 1
    score += role_score
    breakdown["role"] = role_score

    # Skill overlap (1 per overlap, max 3)
    skill_score = 0
    for skill in tags.get("skills", []):
        for course_skill in course.get("skillsCovered", []):
            if skill.lower() in course_skill.lower():
                skill_score += 1
                break
    skill_score = min(skill_score, 3)
    score += skill_score
    breakdown["skills"] = skill_score

    # Challenge relevance (1 per overlap, max 2)
    challenge_score = 0
    for challenge in tags.get("challenges", []):
        for course_challenge in course.get("challengesAddressed", []):
            if challenge.lower() in course_challenge.lower():
                challenge_score += 1
                break
    challenge_score = min(challenge_score, 2)
    score += challenge_score
    breakdown["challenges"] = challenge_score


    # Label assignment
    if score >= 7:
        label = "Highly Recommended"
    elif score >= 4:
        label = "Recommended"
    else:
        label = "Useful"

    return int(score), label, breakdown  # Ensure integer score


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

def serialize_mongo(obj):
    """Recursively convert ObjectId and other non-serializable types to str."""
    if isinstance(obj, list):
        return [serialize_mongo(item) for item in obj]
    elif isinstance(obj, dict):
        return {k: serialize_mongo(v) for k, v in obj.items()}
    elif isinstance(obj, ObjectId):
        return str(obj)
    else:
        return obj

def recommend_courses(student_id: str, refresh=False):
    try:
        user_object_id = ObjectId(student_id)
    except Exception:
        raise ValueError("Invalid student_id format")

    data = assessments_col.find_one({"userId": user_object_id})
    if not data or "answers" not in data:
        raise ValueError("Assessment data not found")

    # If refresh = False, return cached data (if already processed)
    if not refresh and all(key in data for key in CACHE_KEYS):
        recommended = serialize_mongo(data["recommended_courses"])
        return {
            "isProcessed": True,
            "student_id": student_id,
            "profile_analysis": serialize_mongo(data["profile_analysis"]),
            "video_transcript": data["video_transcript"],
            "video_feedback": data["video_feedback"],
            "eye_contact_percent": data["eye_contact_percent"],
            "corrected_level": data["corrected_level"],
            "recommended_courses": recommended
        }

    # If refresh = True, skip AI and video processing, only refresh courses
    if refresh:
        if "profile_analysis" not in data:
            raise ValueError("Profile analysis not found. Please complete the assessment first.")

        tags = data["profile_analysis"]

        # --- Ensure tags["level"] is up-to-date with corrected_level ---
        if "corrected_level" in data and data["corrected_level"]:
            tags["level"] = data["corrected_level"]

        # Fetch latest courses
        raw_courses = list(courses_col.find({"domain": {"$regex": tags["domain"], "$options": "i"}}))
        # --- Always recalculate scores and labels on refresh ---
        scored_courses = []
        for course in raw_courses:
            score, label, breakdown = compute_score(course, tags)
            course_with_score = serialize_mongo(course)
            course_with_score["match_score"] = score
            course_with_score["recommendation_label"] = label
            course_with_score["score_breakdown"] = breakdown
            scored_courses.append((course_with_score, score))
        # Filter and sort by recalculated score
        filtered = [c for c, score in scored_courses if score >= 3]
        if not filtered:
            filtered = [c for c, _ in sorted(scored_courses, key=lambda x: -x[1])[:3]]
        recommended = sorted(filtered, key=lambda c: -c["match_score"])
        recommended_serialized = recommended

        # --- Update recommended_courses with recalculated scores/labels ---
        assessments_col.update_one(
            {"userId": user_object_id},
            {"$set": {"recommended_courses": recommended_serialized}}
        )

        return {
            "isProcessed": True,
            "student_id": student_id,
            "profile_analysis": serialize_mongo(tags),
            "video_transcript": data.get("video_transcript"),
            "video_feedback": data.get("video_feedback"),
            "eye_contact_percent": data.get("eye_contact_percent"),
            "corrected_level": data.get("corrected_level"),
            "recommended_courses": recommended_serialized
        }

    # First time processing: Full AI + Video Analysis
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
    scored_courses = []
    for course in raw_courses:
        score, label, breakdown = compute_score(course, tags)
        course_with_score = serialize_mongo(course)
        course_with_score["match_score"] = score
        course_with_score["recommendation_label"] = label
        course_with_score["score_breakdown"] = breakdown
        scored_courses.append((course_with_score, score))
    filtered = [c for c, score in scored_courses if score >= 3]

    if not filtered:
        filtered = [c for c, _ in sorted(scored_courses, key=lambda x: -x[1])[:3]]

    recommended = sorted(filtered, key=lambda c: -c["match_score"])
    recommended_serialized = recommended

    assessments_col.update_one(
        {"userId": user_object_id},
        {"$set": {
            "profile_analysis": tags,
            "video_transcript": transcript,
            "video_feedback": feedback,
            "eye_contact_percent": eye_contact_percent,
            "corrected_level": corrected_level,
            "recommended_courses": recommended_serialized,
            "isProcessed": True
        }}
    )

    return {
        "student_id": student_id,
        "profile_analysis": serialize_mongo(tags),
        "video_transcript": transcript,
        "video_feedback": feedback,
        "eye_contact_percent": eye_contact_percent,
        "corrected_level": corrected_level,
        "recommended_courses": recommended_serialized,
        "isProcessed": True
    }

