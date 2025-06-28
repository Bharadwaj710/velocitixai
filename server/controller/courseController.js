const Course = require('../models/Course');

// Create new course with modules
exports.createCourse = async (req, res) => {
  try {
    const {
      title,
      description,
      durationWeeks,
      modules,
      level,
      domain,
      idealRoles,
      skillsCovered,
      challengesAddressed
    } = req.body;

    // Validate AI-required fields
    if (
      !domain ||
      !Array.isArray(idealRoles) || !idealRoles.length ||
      !Array.isArray(skillsCovered) || !skillsCovered.length ||
      !Array.isArray(challengesAddressed) || !challengesAddressed.length
    ) {
      return res.status(400).json({ message: "All AI fields are required" });
    }

    const course = new Course({
      title,
      description,
      durationWeeks,
      modules,
      level,
      domain,
      idealRoles,
      skillsCovered,
      challengesAddressed
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

// Get course by ID
exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.status(200).json(course);
  } catch (err) {
    console.error("Fetch course error:", err);
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
// Update course
exports.updateCourse = async (req, res) => {
  try {
    const updateData = { ...req.body };
    // Ensure level and AI fields are updated if present
    if (req.body.level) updateData.level = req.body.level;
    if (req.body.domain) updateData.domain = req.body.domain;
    if (req.body.idealRoles) updateData.idealRoles = req.body.idealRoles;
    if (req.body.skillsCovered) updateData.skillsCovered = req.body.skillsCovered;
    if (req.body.challengesAddressed) updateData.challengesAddressed = req.body.challengesAddressed;

    const updated = await Course.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: "Update failed" });
  }
};

