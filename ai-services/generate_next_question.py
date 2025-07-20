import os
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv("../server/.env")

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-1.5-flash")

def generate_next_question(answer, index, transcript_text="", proficiency="Beginner"):
    prompt = f"""
You are an AI interviewer conducting a mock technical interview for a student who recently completed a professional course.

Proficiency level of student: **{proficiency}**

Here is the transcript of the student's spoken response to Question {index + 1}:
"{transcript_text.strip()}"

Their summarized answer was:
"{answer.strip()}"

Your task:
- If the answer shows **limited understanding** or if the student says "I don't know", generate a **basic but relevant** follow-up question to test **core concepts** from the course domain (e.g., CSS, JS, React, etc.).
- If partially correct, ask a **related but moderate** question.
- If the answer is solid, ask a **slightly more practical or real-world** question to assess deeper readiness.

The goal is to:
- Keep the questions tied to the original course topics.
- Evaluate the student's understanding progressively.
- Help the student grow into a professional role (e.g., junior developer, data analyst, etc.).

Return ONLY the next interview question. No explanation, no quotes, no commentary. Output just the question on a single line.
"""

    try:
        response = model.generate_content(prompt)
        result = response.text.strip().split("\n")[0]  # take only first line
        print("🤖 Gemini Response:", result)
        return {"nextQuestion": result}
    except Exception as e:
        print("❌ Gemini error:", e)
        return {"error": str(e)}
