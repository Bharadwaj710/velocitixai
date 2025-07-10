const express = require("express");
const router = express.Router();
const axios = require("axios");

const Course = require("../models/Course");
const Transcript = require("../models/Transcript");
const Quiz = require("../models/Quiz");

// 🔹 POST /api/quiz/generate-module/:courseId/:weekNumber
router.post("/generate-module/:courseId/:weekNumber", async (req, res) => {
  const { courseId, weekNumber } = req.params;
  const results = [];

  try {
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    const week = (course.weeks || []).find(
      (w) => String(w.weekNumber) === String(weekNumber)
    );
    if (!week) {
      return res.status(404).json({ error: "Week not found in course" });
    }

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

        try {
          const flaskRes = await axios.post(
            "http://localhost:5001/generate-quiz",
            { transcript: transcriptText },
            { timeout: 30000 }
          );

          const quizQuestions = flaskRes.data;

          if (!Array.isArray(quizQuestions) || quizQuestions.length === 0) {
            throw new Error("Invalid or empty quiz format from AI service");
          }

          await Quiz.findOneAndUpdate(
            { lessonId: lesson._id },
            {
              $set: {
                generated: true,
                questions: quizQuestions,
                updatedAt: new Date(),
              },
              $setOnInsert: {
                createdAt: new Date(),
              },
            },
            { upsert: true }
          );

          results.push({
            lessonId: lesson._id,
            title: lesson.title,
            status: "generated",
            questionCount: quizQuestions.length,
          });
        } catch (err) {
          results.push({
            lessonId: lesson._id,
            title: lesson.title,
            status: "error",
            error: err.message || "Quiz generation failed",
          });
        }
      }
    }

    return res.status(200).json({ results });
  } catch (err) {
    console.error("❌ Quiz generation failed:", err);
    return res.status(500).json({
      error: "Internal server error during quiz generation",
      details: err.message,
    });
  }
});

// 🔹 GET /api/quiz/:lessonId
router.get("/:lessonId", async (req, res) => {
  const { lessonId } = req.params;

  if (!lessonId || lessonId.length !== 24) {
    return res.status(400).json({ error: "Invalid lessonId" });
  }

  try {
    const quiz = await Quiz.findOne({ lessonId });

    if (
      !quiz ||
      !Array.isArray(quiz.questions) ||
      quiz.questions.length === 0
    ) {
      return res.status(404).json({ error: "Quiz not found or empty" });
    }

    return res.status(200).json(quiz);
  } catch (err) {
    console.error("❌ Error fetching quiz:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
