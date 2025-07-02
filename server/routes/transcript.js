const express = require("express");
const router = express.Router();
const axios = require("axios");
const mongoose = require("mongoose");
const Course = require("../models/Course");
const Transcript = require("../models/Transcript");

// Config
const FLASK_SERVER_URL = "http://localhost:5001/generate-transcript";

// Helper: Send one lesson to Flask for transcript
async function sendToFlask(lessonData) {
  try {
    const res = await axios.post(FLASK_SERVER_URL, lessonData);
    return { status: "success", data: res.data };
  } catch (err) {
    return {
      status: "error",
      error: err.response?.data || err.message,
    };
  }
}

// POST /api/transcripts/generate-module
router.post("/generate-module", async (req, res) => {
  const { lessons } = req.body; // Array of { videoUrl, videoId, lessonId, courseId }
  if (!Array.isArray(lessons) || lessons.length === 0) {
    return res.status(400).json({ error: "lessons array required" });
  }

  try {
    const results = await Promise.all(
      lessons.map(async (lesson) => ({
        ...lesson,
        ...(await sendToFlask(lesson)),
      }))
    );

    res.json({ message: "Transcript generation completed.", results });
  } catch (err) {
    console.error("[Transcript] Error generating transcripts:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/transcripts/generate-course
router.post("/generate-course", async (req, res) => {
  const { courseId } = req.body;
  if (!courseId) {
    return res.status(400).json({ error: "courseId is required" });
  }

  try {
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: "Course not found" });

    const lessons = [];

    (course.weeks || []).forEach((week) => {
      (week.modules || []).forEach((mod) => {
        (mod.lessons || []).forEach((lesson) => {
          if (lesson.videoUrl && lesson.videoId && lesson._id) {
            lessons.push({
              videoUrl: lesson.videoUrl,
              videoId: lesson.videoId,
              lessonId: lesson._id.toString(),
              courseId: course._id.toString(),
            });
          }
        });
      });
    });

    if (lessons.length === 0) {
      return res
        .status(400)
        .json({ error: "No valid lessons with video found." });
    }

    const results = await Promise.all(
      lessons.map(async (lesson) => ({
        ...lesson,
        ...(await sendToFlask(lesson)),
      }))
    );

    res.json({ message: "Transcript generation completed.", results });
  } catch (err) {
    console.error("[Transcript] Error generating course transcripts:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/transcripts/by-lesson/:lessonId
router.get("/by-lesson/:lessonId", async (req, res) => {
  const { lessonId } = req.params;

  try {
    const query = mongoose.Types.ObjectId.isValid(lessonId)
      ? { lessonId: new mongoose.Types.ObjectId(lessonId) }
      : { lessonId };

    const transcript = await Transcript.findOne(query);

    if (!transcript) {
      return res
        .status(404)
        .json({ message: "Transcript not found", transcript: [] });
    }

    if (!Array.isArray(transcript.transcript)) {
      return res
        .status(500)
        .json({ message: "Invalid transcript format", transcript: [] });
    }

    res.json({ transcript: transcript.transcript });
  } catch (err) {
    console.error("[Transcript] Error fetching transcript:", err);
    res.status(500).json({ transcript: [] });
  }
});

module.exports = router;
