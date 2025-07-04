const express = require("express");
const router = express.Router();
const courseController = require("../controller/courseController");
const Course = require("../models/Course"); // ✅ Make sure this is correct path

// Utility to extract YouTube video ID
function extractYouTubeId(url) {
  if (!url) return "";
  // Handles youtu.be, youtube.com/watch?v=, youtube.com/embed/
  const regExp =
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([0-9A-Za-z_-]{11})/;
  const match = url.match(regExp);
  return match ? match[1] : "";
}

// When creating a course
router.post("/", async (req, res) => {
  try {
    // For each lesson, add videoId
    if (req.body.weeks) {
      req.body.weeks.forEach((week) => {
        week.modules?.forEach((mod) => {
          mod.lessons?.forEach((lesson) => {
            lesson.videoId = extractYouTubeId(lesson.videoUrl);
          });
        });
      });
    }
    const course = new Course(req.body);
    await course.save();
    res.status(201).json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// When updating a course
router.put("/:id", async (req, res) => {
  try {
    if (req.body.weeks) {
      req.body.weeks.forEach((week) => {
        week.modules?.forEach((mod) => {
          mod.lessons?.forEach((lesson) => {
            lesson.videoId = extractYouTubeId(lesson.videoUrl);
          });
        });
      });
    }
    const updated = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/", courseController.getCourses);
router.delete("/:id", courseController.deleteCourse);
router.put('/:courseId/lessons/:lessonId/add-pdf', courseController.addPdfToLesson);

router.get("/:id", courseController.getCourseById);
// Add this route in your course routes


// ✅ Fix: use the actual Course model


module.exports = router;

