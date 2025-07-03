const express = require("express");
const router = express.Router();
const axios = require("axios");
const path = require("path");

const Course = require("../models/Course");
const Transcript = require("../models/Transcript");
const Quiz = require("../models/Quiz");

// POST /api/quiz/generate-module/:courseId/:weekNumber
router.post("/generate-module/:courseId/:weekNumber", async (req, res) => {
  const { courseId, weekNumber } = req.params;
  const results = [];

  try {
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: "Course not found" });

    const week = (course.weeks || []).find(
      (w) => String(w.weekNumber) === String(weekNumber)
    );
    if (!week) return res.status(404).json({ error: "Week not found" });

    // Loop through all lessons in the week
    for (const module of week.modules || []) {
      for (const lesson of module.lessons || []) {
        if (lesson.quizEnabled === false) {
          results.push({
            lessonId: lesson._id,
            title: lesson.title,
            status: "skipped (quiz disabled)",
          });
          continue;
        }

        // Fetch transcript for the lesson
        const transcriptDoc = await Transcript.findOne({
          lessonId: lesson._id,
        });

        if (!transcriptDoc || !Array.isArray(transcriptDoc.transcript)) {
          results.push({
            lessonId: lesson._id,
            title: lesson.title,
            status: "skipped (no transcript)",
          });
          continue;
        }

        // Combine transcript segments into full text
        const transcriptText = transcriptDoc.transcript
          .map((seg) => seg.text)
          .join(" ")
          .trim();

        if (!transcriptText || transcriptText.length < 50) {
          results.push({
            lessonId: lesson._id,
            title: lesson.title,
            status: "skipped (empty or short transcript)",
          });
          continue;
        }

        // Call Flask AI API
        let quizQuestions;
        try {
          const flaskResponse = await axios.post(
            "http://localhost:5001/generate-quiz",
            { transcript: transcriptText },
            { timeout: 30000 }
          );

          quizQuestions = flaskResponse.data;

          if (!Array.isArray(quizQuestions)) {
            throw new Error("Invalid quiz format from AI service");
          }
        } catch (err) {
          results.push({
            lessonId: lesson._id,
            title: lesson.title,
            status: "error",
            error: err.message || "Flask service call failed",
          });
          continue;
        }

        // Store or update quiz in DB
        await Quiz.findOneAndUpdate(
          { lessonId: lesson._id },
          {
            $set: {
              generated: true,
              questions: quizQuestions,
              updatedAt: new Date(),
            },
            $setOnInsert: { createdAt: new Date() },
          },
          { upsert: true }
        );

        results.push({
          lessonId: lesson._id,
          title: lesson.title,
          status: "generated",
          questionCount: quizQuestions.length,
        });
      }
    }

    res.json({ results });
  } catch (err) {
    console.error("Quiz generation error:", err.message);
    res.status(500).json({
      error: "Quiz generation failed",
      details: err.message,
    });
  }
});

module.exports = router;
