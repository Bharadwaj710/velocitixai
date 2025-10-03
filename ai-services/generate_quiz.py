import sys
import argparse
import json
import os
import re
from dotenv import load_dotenv

# Load environment variables
load_dotenv("../server/.env")

def generate_quiz_from_transcript(transcript):
    import google.generativeai as genai

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY not found in environment variables.")

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-2.5-flash")

    # Convert transcript to plain text if it's a list or dict
    if isinstance(transcript, list):
        transcript = " ".join(seg.get("text", "") for seg in transcript)
    elif isinstance(transcript, dict) and "transcript" in transcript:
        transcript = " ".join(seg.get("text", "") for seg in transcript["transcript"])
    elif not isinstance(transcript, str):
        transcript = str(transcript)

    transcript = transcript.strip()

    # Truncate if too long
    if len(transcript) > 12000:
        transcript = transcript[:12000] + "..."

    prompt = f"""
You are an intelligent educational assistant.

Given the transcript of a video lesson, generate a high-quality quiz with 2 to 10 questions that test understanding of its key concepts.

Each question must follow this structure:

- **"type"** (one of): 
  - "mcq": Multiple Choice Question (4 options)
  - "fill": Fill in the Blank
  - "text": Short Answer (user must type the correct word/phrase)

- **"question"**: Clear and concise
- **"options"**: Only if "type" is "mcq", provide exactly 4 options
- **"correctAnswer"**: Exact answer string
- **"explanation"**: Explain why this answer is correct, even if it is simple or obvious.

Always include an explanation for each question. Avoid vague or empty explanations.

### Output format (JSON array only):
[
  {{
    "type": "mcq" | "fill" | "text",
    "question": "string",
    "options": ["A", "B", "C", "D"],     // only if type is "mcq"
    "correctAnswer": "string",
    "explanation": "string"
  }},
  ...
]

Transcript:
\"\"\"
{transcript}
\"\"\"

Return only the JSON array as output.
"""

    try:
        response = model.generate_content(prompt)
        raw_output = response.text.strip()

        # Extract valid JSON array
        json_match = re.search(r"\[\s*{.*}\s*\]", raw_output, re.DOTALL)
        if not json_match:
            raise ValueError("No valid JSON array found in model output.")

        quiz_data = json.loads(json_match.group(0))

        # Clean and validate quiz items
        cleaned_quiz = []
        for q in quiz_data:
            q_type = q.get("type", "").strip().lower()
            question = q.get("question", "").strip()
            correct = q.get("correctAnswer", "").strip()
            explanation = q.get("explanation", "").strip()

            # Skip if invalid structure
            if not q_type or not question or not correct:
                continue

            # Fallback for empty explanation
            if not explanation:
                explanation = f'The correct answer is "{correct}" because it best matches the concept in the question.'

            quiz_item = {
                "type": q_type,
                "question": question,
                "correctAnswer": correct,
                "explanation": explanation,
            }

            if q_type == "mcq":
                options = q.get("options", [])
                if not isinstance(options, list) or len(options) != 4:
                    continue
                quiz_item["options"] = [opt.strip() for opt in options]

            cleaned_quiz.append(quiz_item)

        return cleaned_quiz

    except Exception as e:
        print(f"[❌ ERROR] Failed to generate or parse quiz: {e}", file=sys.stderr)
        return []

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate quiz from transcript using Gemini.")
    parser.add_argument("--transcript", type=str, required=True)
    args = parser.parse_args()

    try:
        # Attempt to parse JSON input
        parsed_input = json.loads(args.transcript)
    except Exception:
        parsed_input = args.transcript

    print("📤 Generating quiz from transcript...", file=sys.stderr)
    quiz = generate_quiz_from_transcript(parsed_input)
    print(json.dumps(quiz, ensure_ascii=False, indent=2))
