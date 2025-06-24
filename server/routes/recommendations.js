const express = require("express");
const axios = require("axios");
const router = express.Router();

// Proxy to Flask AI service
router.get("/recommendations/:studentId", async (req, res) => {
  const studentId = req.params.studentId;

  try {
    const flaskResponse = await axios.post("http://localhost:5001/recommend", {
      student_id: studentId,
    });

    res.json(flaskResponse.data);
  } catch (error) {
    console.error(
      "Flask AI service error:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Failed to get course recommendations" });
  }
});

module.exports = router;
