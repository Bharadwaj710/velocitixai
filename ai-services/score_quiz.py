import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv("../server/.env")

def score_quiz_with_ai(student_answers, original_questions):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY not found in .env")

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-1.5-flash")

    prompt = f"""
You're an intelligent quiz evaluator.

Compare each student's answer to the correct answer from the questions, and assign a score out of 10.
Also, give feedback: "Correct", "Partially correct", or "Incorrect" for each question.

Return a JSON in the following format:
{{
  "feedback": [ "Correct", "Incorrect", ... ],
  "scores": [10, 0, ...]
}}

Only respond with valid JSON. No extra text or explanation.

Questions:
{json.dumps(original_questions, indent=2)}

Student Answers:
{json.dumps(student_answers, indent=2)}
"""

    try:
        response = model.generate_content(prompt)
        result_text = response.text.strip()

        json_start = result_text.find("{")
        json_end = result_text.rfind("}") + 1
        json_data = result_text[json_start:json_end]
        result = json.loads(json_data)

        # Score normalization
        scores = result.get("scores", [])
        total_raw_score = sum(scores)
        max_raw_score = len(scores) * 10
        total_percent = round((total_raw_score / max_raw_score) * 100)

        # Add total score and pass/fail
        result["totalScore"] = total_percent
        result["passed"] = total_percent >= 60

        return result

    except Exception as e:
        print(f"[AI ERROR] {e}")
        return {
            "feedback": ["AI Error"] * len(student_answers),
            "scores": [0] * len(student_answers),
            "totalScore": 0,
            "passed": False,
            "error": str(e)
        }
