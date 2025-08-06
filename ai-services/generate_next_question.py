import os
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv("../server/.env")

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-1.5-flash")

def generate_next_question(
    answer,
    index,
    transcript_text="",
    proficiency="Beginner",
    course_title="",
    skills=[],
    lessons=[],
    roles=[]
):
    skills_str = "\n".join(f"- {s}" for s in skills[:8])
    lessons_str = "\n".join(f"- {l}" for l in lessons[:10])
    roles_str = ", ".join(roles[:5])

    prompt = f"""
You are an AI interviewer conducting a structured 10-question technical interview for a student.

📘 Course Title: "{course_title}"
🎯 Student Proficiency: {proficiency}
📚 Covered Skills:
{skills_str}

📖 Lessons Covered:
{lessons_str}

🎓 Ideal Roles: {roles_str}

👂 Transcript of the student's answer to Question {index + 1}:
"{transcript_text.strip()}"

📝 Their summarized answer:
"{answer.strip()}"

Your objective:
- Ensure the 10 questions **collectively assess the entire course content** (fonts, borders, float, shadows, icons, flexbox, grid, etc).
- Avoid repeating questions on already asked subtopics.
- Vary question depth **based on student's response quality**.

Rules:
- If the answer is weak, "I don’t know", or the student skips/times out, ask a **basic** question from a different key topic.
- If it's partially correct, ask a **related moderate** question on a different course concept.
- If the answer is solid, ask a **real-world or applied** question from an advanced topic **not yet covered**.
- **Do not ask multiple questions from the same lesson or skill.**
- Never repeat a question. Always cover a new subtopic.
- If the student skipped, revisit later.
- If timed out, do NOT revisit. Treat as permanently unanswered.
- When revisiting skipped questions, use their original index and wording.
- Keep questions relevant to **course scope**, but explore **edge cases or role-based applications** in strong answers.
- No repeats. No explanation. Just a clear interview question on one line.

Return ONLY the next question.
"""
    print("🤖 Gemini Prompt:", prompt.strip())
    try:
        response = model.generate_content(prompt)
        result = response.text.strip().split("\n")[0]
        print("🤖 Gemini Response:", result)
        return {"nextQuestion": result}
    except Exception as e:
        print("❌ Gemini error:", e)
        return {"error": str(e)}
