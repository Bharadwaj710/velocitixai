const express = require('express');
const router = express.Router();
const courseController = require('../controller/courseController');
const Course = require('../models/Course'); // ✅ Make sure this is correct path

router.post('/', courseController.createCourse);
router.get('/', courseController.getCourses);
router.delete('/:id', courseController.deleteCourse);
router.put('/:id', courseController.updateCourse);
router.get('/:id', courseController.getCourseById);

// ✅ Fix: use the actual Course model
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch course' });
  }
});

module.exports = router;
