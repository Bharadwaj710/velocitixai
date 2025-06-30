const express = require("express");
const router = express.Router();
const axios = require("axios");
const mongoose = require("mongoose");
const Course = require("../models/Course");
const Transcript = require("../models/Transcript");

// POST /api/transcripts/generate-module
router.post("/generate-module", async (req, res) => {
  const { videoUrls } = req.body;
  if (!Array.isArray(videoUrls) || videoUrls.length === 0) {
    return res.status(400).json({ error: "videoUrls array required" });
  }

  try {
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
    res.status(500).json({
      error: "Transcript generation failed",
      details: err.message,
    });
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
    res.status(500).json({
      error: "Transcript generation failed",
      details: err.message,
    });
  }
});

// GET /api/transcripts/:lessonId
router.get("/:lessonId", async (req, res) => {
  const { lessonId } = req.params;
  let doc = null;
  const tried = [];

  try {
    // Try ObjectId
    if (mongoose.Types.ObjectId.isValid(lessonId)) {
      tried.push("ObjectId");
      doc = await Transcript.findOne({
        lessonId: new mongoose.Types.ObjectId(lessonId),
      });
    }

    // Try as raw string lessonId
    if (!doc) {
      tried.push("lessonId string");
      doc = await Transcript.findOne({ lessonId });
    }

    // Try as YouTube videoId (11 chars)
    if (!doc && lessonId.length === 11 && /^[\w-]{11}$/.test(lessonId)) {
      tried.push("videoId");
      doc = await Transcript.findOne({ videoId: lessonId });
    }

    if (!doc) {
      console.warn(
        `[Transcript] Not found for: ${lessonId}. Tried: ${tried.join(", ")}`
      );
      return res.status(404).json({ transcript: [] });
    }

    if (!Array.isArray(doc.transcript)) {
      console.warn(
        `[Transcript] Invalid transcript array for lessonId=${lessonId}`
      );
      return res.status(500).json({ transcript: [] });
    }

    res.json({ transcript: doc.transcript });
  } catch (err) {
    console.error("[Transcript API] Error fetching transcript:", err);
    res.status(500).json({ transcript: [] });
  }
});

module.exports = router;
