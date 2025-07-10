const express = require("express");
const router = express.Router();
const Progress = require("../models/Progress");

// 🔹 POST /api/progress/complete
router.post("/complete", async (req, res) => {
  const { userId, courseId, lessonId } = req.body;

  if (!userId || !courseId || !lessonId) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    let progress = await Progress.findOne({ userId, courseId });

    if (!progress) {
      progress = new Progress({
        userId,
        courseId,
        completedLessons: [lessonId],
        quizResults: [],
      });
    } else {
      if (!Array.isArray(progress.completedLessons)) {
        progress.completedLessons = [];
      }
      if (!progress.completedLessons.includes(lessonId)) {
        progress.completedLessons.push(lessonId);
      }
    }

    progress.updatedAt = new Date();
    await progress.save();

    return res
      .status(200)
      .json({ message: "Lesson marked as completed", progress });
  } catch (err) {
    console.error("❌ Error updating progress:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// 🔹 POST /api/progress/uncomplete
router.post("/uncomplete", async (req, res) => {
  const { userId, courseId, lessonId } = req.body;

  if (!userId || !courseId || !lessonId) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    let progress = await Progress.findOne({ userId, courseId });

    if (!progress) {
      return res.status(404).json({ message: "Progress not found" });
    }

    progress.completedLessons = progress.completedLessons.filter(
      (l) => l.toString() !== lessonId
    );

    progress.updatedAt = new Date();
    await progress.save();

    return res
      .status(200)
      .json({ message: "Lesson unmarked as completed", progress });
  } catch (err) {
    console.error("❌ Error updating progress:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// 🔹 POST /api/progress/submit-quiz
router.post("/submit-quiz", async (req, res) => {
  const { studentId, courseId, lessonId, score, passed, answers, feedback } =   req.body;


  if (
    !studentId ||
    !courseId ||
    !lessonId ||
    typeof score !== "number" ||
    typeof passed !== "boolean"
  ) {
    return res.status(400).json({ message: "Missing or invalid fields" });
  }

  try {
    let progress = await Progress.findOne({ userId: studentId, courseId });

    const newQuizResult = {
      lessonId,
      answers,
      feedback,
      score,
      passed,
      submittedAt: new Date(),
    };

    if (!progress) {
      // Create new progress record
      progress = new Progress({
        userId: studentId,
        courseId,
        completedLessons: passed ? [lessonId] : [],
        quizResults: [newQuizResult],
      });
    } else {
      // Ensure arrays are present
      if (!Array.isArray(progress.quizResults)) progress.quizResults = [];
      if (!Array.isArray(progress.completedLessons))
        progress.completedLessons = [];

      // Check if quiz already exists for this lesson
      const index = progress.quizResults.findIndex(
        (q) => q.lessonId.toString() === lessonId
      );

      if (index !== -1) {
        progress.quizResults[index] = newQuizResult;
      } else {
        progress.quizResults.push(newQuizResult);
      }

      // Mark lesson complete if passed
      if (passed && !progress.completedLessons.includes(lessonId)) {
        progress.completedLessons.push(lessonId);
      }
    }

    progress.updatedAt = new Date();
    await progress.save();

    return res.status(200).json({
      message: "Quiz result saved successfully",
      progress,
    });
  } catch (err) {
    console.error("❌ Error saving quiz result:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// 🔹 GET /api/progress/:userId/:courseId
router.get("/:userId/:courseId", async (req, res) => {
  const { userId, courseId } = req.params;

  if (!userId || !courseId || courseId.length !== 24) {
    return res.status(400).json({ error: "Invalid request parameters" });
  }

  try {
    const progress = await Progress.findOne({ userId, courseId });

    if (!progress) {
      return res.status(200).json({
        completedLessons: [],
        quizResults: [],
      });
    }

    return res.status(200).json({
      completedLessons: progress.completedLessons || [],
      quizResults: progress.quizResults || [],
    });
  } catch (err) {
    console.error("❌ Error fetching progress:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
