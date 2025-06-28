from flask import Flask, request, jsonify
from recommend import recommend_courses
from career_video_analysis import analyze_career_video
from student_chatbot import chatbot_bp  # 👈 Import Blueprint
import google.generativeai as genai

app = Flask(__name__)
app.register_blueprint(chatbot_bp)  # 👈 Register Blueprint

# --- Add CORS headers for all responses ---
@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "http://localhost:3000"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS"
    return response

# --- Handle preflight OPTIONS requests globally ---
@app.route('/<path:path>', methods=['OPTIONS'])
def options_handler(path):
    return '', 204

@app.route("/recommend", methods=["POST"])
def recommend():
    data = request.get_json()
    student_id = data.get("student_id")
    refresh = data.get("refresh", False)  # Accept refresh param

    if not student_id:
        return jsonify({"error": "Student ID missing"}), 400

    try:
        result = recommend_courses(student_id, refresh=refresh)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/analyze-career-video", methods=["POST"])
def analyze_video():
    data = request.get_json()
    video_url = data.get("video_url")

    if not video_url:
        return jsonify({"error": "video_url is required"}), 400

    try:
        result = analyze_career_video(video_url)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/suggest-course-metadata", methods=["POST"])
def suggest_course_metadata():
    data = request.get_json()
    title = data.get("title", "")
    if not title:
        return jsonify({"error": "Title is required"}), 400

    prompt = f"""
    Given the following YouTube course title{' and description' if data.get('description') else ''}, suggest:
    - The most relevant domain for this course (as a string, e.g., "Technology and Innovation", "Business and Finance", etc.)
    - 3 to 5 ideal job roles this course is suited for (as an array of short role names)
    - 3 to 5 key skills covered by this course (as an array)
    - 2 to 3 learning challenges addressed by this course (as an array)
    Respond ONLY with a JSON object with these keys: domain, idealRoles, skillsCovered, challengesAddressed.

    Example:
    {{
      "domain": "Technology and Innovation",
      "idealRoles": ["Frontend Developer", "Product Manager"],
      "skillsCovered": ["JavaScript", "AWS", "Data Analysis"],
      "challengesAddressed": ["Debugging", "Lack of Field Exposure"]
    }}

    Course Title: {title}
    {"Course Description: " + data.get("description") if data.get("description") else ""}
    """
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        import re, json
        match = re.search(r"\{.*\}", response.text, re.DOTALL)
        if match:
            return jsonify(json.loads(match.group(0)))
        return jsonify({"error": "Could not parse AI response"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    print(app.url_map)
    app.run(debug=True, port=5001)
    app.run(debug=True, port=5001)
