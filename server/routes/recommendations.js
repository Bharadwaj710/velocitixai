const express = require("express");
const axios = require("axios");
const router = express.Router();

// Proxy to Flask AI service
router.get("/recommendations/:studentId", async (req, res) => {
  const studentId = req.params.studentId;
  const refresh = req.query.refresh === "1" || req.query.refresh === "true";

  try {
    // Pass refresh param to Flask AI service
    const flaskResponse = await axios.post("http://localhost:5001/recommend", {
      student_id: studentId,
      refresh, // This will be true/false
    });

    // Defensive: always return recommended_courses as array
    const data = flaskResponse.data || {};
    if (!Array.isArray(data.recommended_courses)) {
      data.recommended_courses = [];
    }
    res.json(data);
  } catch (error) {
    console.error(
      "Flask AI service error:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Failed to get course recommendations" });
  }
});

module.exports = router;
