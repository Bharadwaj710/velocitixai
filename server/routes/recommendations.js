const express = require("express");
const axios = require("axios");
const router = express.Router();
const Assessment = require("../models/CareerAssessment"); // Adjust the path to your model

router.get("/recommendations/:studentId", async (req, res) => {
  const studentId = req.params.studentId;

  try {
    // Check if recommendations are already cached
    const cached = await Assessment.findOne({ userId: studentId });
    if (
      cached &&
      cached.profile_analysis &&
      cached.video_transcript &&
      cached.video_feedback &&
      cached.eye_contact_percent &&
      cached.recommended_courses &&
      cached.recommended_courses.length > 0
    ) {
      console.log("✅ Returning cached recommendations.");
      return res.json({
        student_id: studentId,
        profile_analysis: cached.profile_analysis,
        video_transcript: cached.video_transcript,
        video_feedback: cached.video_feedback,
        eye_contact_percent: cached.eye_contact_percent,
        recommended_courses: cached.recommended_courses,
      });
    }

    console.log("🔍 No cache found, calling Flask service...");
    const flaskResponse = await axios.post("http://localhost:5001/recommend", {
      student_id: studentId,
    });

    res.json(flaskResponse.data);
  } catch (error) {
    console.error("Flask AI service error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to get course recommendations" });
  }
});

module.exports = router;
