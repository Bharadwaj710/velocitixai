const Course = require('../models/Course');

// Create new course with modules
exports.createCourse = async (req, res) => {
  try {
    const { title, description, durationWeeks, modules } = req.body;

    const course = new Course({
      title,
      description,
      durationWeeks,
      modules,
    });

    const saved = await course.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("Create course error:", err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all courses
exports.getCourses = async (req, res) => {
  try {
    const courses = await Course.find();
    res.status(200).json(courses);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete course
exports.deleteCourse = async (req, res) => {
  try {
    await Course.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
};
