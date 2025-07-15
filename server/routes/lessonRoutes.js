const express = require("express");
const router = express.Router();
const Lesson = require("../models/Lesson");
const Transcript = require("../models/Transcript");
const Quiz = require("../models/Quiz");
const Progress = require("../models/Progress");
const Course = require("../models/Course");


// 🔹 DELETE /api/lessons/:lessonId
router.delete("/:lessonId", async (req, res) => {
  const { lessonId } = req.params;

  try {
    const course = await Course.findOne({ "weeks.modules.lessons._id": lessonId });
    if (!course) return res.status(404).json({ error: "Lesson not found in any course" });

    // Loop through course to remove the lesson
    course.weeks.forEach((week) => {
      week.modules.forEach((module) => {
        module.lessons = module.lessons.filter(
          (lesson) => String(lesson._id) !== String(lessonId)
        );
      });
    });

    await course.save();
    return res.status(200).json({ message: "Lesson removed from course" });
  } catch (err) {
    console.error("❌ Failed to delete lesson from course:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
