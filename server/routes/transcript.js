const express = require("express");
const router = express.Router();
const axios = require("axios");
const Course = require("../models/Course");

// POST /api/transcripts/generate-module
router.post("/generate-module", async (req, res) => {
  const { videoUrls } = req.body;
  if (!Array.isArray(videoUrls) || videoUrls.length === 0) {
    return res.status(400).json({ error: "videoUrls array required" });
  }

  try {
    // Call Flask for each video URL in parallel
    const results = await Promise.all(
      videoUrls.map(async (videoUrl) => {
        try {
          const flaskRes = await axios.post(
            "http://localhost:5001/generate-transcript",
            { videoUrl }
          );
          return { videoUrl, status: "success", data: flaskRes.data };
        } catch (err) {
          return {
            videoUrl,
            status: "error",
            error: err.response?.data || err.message,
          };
        }
      })
    );
    res.json({ message: "Transcript generation requests sent.", results });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Transcript generation failed", details: err.message });
  }
});

// POST /api/transcripts/generate-course
router.post("/generate-course", async (req, res) => {
  const { courseId } = req.body;
  if (!courseId) {
    return res.status(400).json({ error: "courseId required" });
  }
  try {
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: "Course not found" });

    // Gather all videoUrls with valid videoId
    const videoUrls = [];
    (course.weeks || []).forEach((week) => {
      (week.modules || []).forEach((mod) => {
        (mod.lessons || []).forEach((lesson) => {
          if (lesson.videoId && lesson.videoUrl) {
            videoUrls.push(lesson.videoUrl);
          }
        });
      });
    });

    if (videoUrls.length === 0) {
      return res
        .status(400)
        .json({ error: "No lessons with valid video URLs found." });
    }

    // Call Flask for each video URL in parallel
    const results = await Promise.all(
      videoUrls.map(async (videoUrl) => {
        try {
          const flaskRes = await axios.post(
            "http://localhost:5001/generate-transcript",
            { videoUrl }
          );
          return { videoUrl, status: "success", data: flaskRes.data };
        } catch (err) {
          return {
            videoUrl,
            status: "error",
            error: err.response?.data || err.message,
          };
        }
      })
    );
    res.json({ message: "Transcript generation requests sent.", results });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Transcript generation failed", details: err.message });
  }
});

module.exports = router;
