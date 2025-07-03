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
    model = genai.GenerativeModel("gemini-1.5-flash")

    # 🧠 FIX: Convert transcript list to string if needed
    if isinstance(transcript, list):
        transcript = " ".join(seg.get("text", "") for seg in transcript)
    elif isinstance(transcript, dict) and "transcript" in transcript:
        # fallback if JSON structure is wrapped under key
        transcript = " ".join(seg.get("text", "") for seg in transcript["transcript"])

    # ✅ Only call .strip() once it's definitely a string
    if not isinstance(transcript, str):
        transcript = str(transcript)

    transcript = transcript.strip()

    # Truncate
    if len(transcript) > 12000:
        transcript = transcript[:12000] + "..."
    
    prompt = f"""
You are an educational AI assistant. Given a lesson transcript, generate 2 to 10 quiz questions based on its core concepts.

Each question must be of one of these types:
1. "mcq" — Multiple choice (provide 4 options)
2. "text" — Short answer
3. "fill" — Fill in the blank

Output format (JSON array):
[
  {{
    "type": "mcq" | "text" | "fill",
    "question": "string",
    "options": ["A", "B", "C", "D"],    // Only for "mcq"
    "correctAnswer": "string",
    "explanation": "string"
  }},
  ...
]

Transcript:
\"\"\" 
{transcript}
\"\"\"

Respond ONLY with the JSON array. Do not include any explanation or extra text.
"""

    try:
        response = model.generate_content(prompt)
        raw_output = response.text.strip()
        json_match = re.search(r"\[.*\]", raw_output, re.DOTALL)
        if not json_match:
            raise ValueError("No JSON array found in model output.")
        quiz_data = json.loads(json_match.group(0))
        return quiz_data
    except Exception as e:
        print(f"[ERROR] Failed to generate or parse quiz: {e}", file=sys.stderr)
        return []

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate quiz from transcript using Gemini.")
    parser.add_argument("--transcript", type=str, required=True)
    args = parser.parse_args()

    try:
        # Try parsing the transcript string to see if it's actually JSON
        parsed_input = json.loads(args.transcript)
    except Exception:
        parsed_input = args.transcript

    quiz = generate_quiz_from_transcript(parsed_input)
    print(json.dumps(quiz, ensure_ascii=False, indent=2))
