from flask import Flask, request, jsonify
from recommend import recommend_courses
from career_video_analysis import analyze_career_video

app = Flask(__name__)

@app.route("/recommend", methods=["POST"])
def recommend():
    data = request.get_json()
    student_id = data.get("student_id")

    if not student_id:
        return jsonify({"error": "Student ID missing"}), 400

    try:
        result = recommend_courses(student_id)
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

if __name__ == "__main__":
    print(app.url_map)
    app.run(debug=True, port=5001)
