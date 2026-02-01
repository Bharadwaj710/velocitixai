const Course = require('../models/Course');

// Create new course with weeks/modules/lessons
exports.createCourse = async (req, res) => {
  try {
    const {
      title,
      description,
      durationWeeks,
      weeks,
      level,
      domain,
      idealRoles,
      skillsCovered,
      challengesAddressed,
      timeCommitmentRecommended
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

    // Defensive: weeks must be an array
    if (!Array.isArray(weeks) || weeks.length === 0) {
      return res.status(400).json({ message: "Weeks structure required" });
    }

    const course = new Course({
      title,
      description,
      durationWeeks,
      weeks,
      level,
      domain,
      idealRoles,
      skillsCovered,
      challengesAddressed,
      timeCommitmentRecommended
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
    const { id } = req.params;
    // Defensive: check for valid ObjectId and not undefined
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid course id' });
    }
    const course = await Course.findById(id);

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
    // Only update weeks if present
    if (req.body.weeks) updateData.weeks = req.body.weeks;
    // Ensure level and AI fields are updated if present
    if (req.body.level) updateData.level = req.body.level;
    if (req.body.domain) updateData.domain = req.body.domain;
    if (req.body.idealRoles) updateData.idealRoles = req.body.idealRoles;
    if (req.body.skillsCovered) updateData.skillsCovered = req.body.skillsCovered;
    if (req.body.challengesAddressed) updateData.challengesAddressed = req.body.challengesAddressed;

 
    const course = await Course.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!course) return res.status(404).json({ message: 'Course not found' });

    course.set(req.body); // 🔁 apply updates
    await course.save();  // ✅ this triggers full validation

    res.status(200).json(course);
  } catch (err) {
    res.status(500).json({ message: "Update failed" });
  }
};

// controllers/courseController.js
exports.addPdfToLesson = async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;
    const { pdfName, pdfUrl } = req.body;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    let lessonFound = false;

    course.weeks.forEach((week) => {
      week.modules.forEach((module) => {
        module.lessons.forEach((lesson) => {
          if (lesson._id.toString() === lessonId) {
            lesson.resources = lesson.resources || [];
            lesson.resources.push({ name: pdfName, url: pdfUrl });
            lessonFound = true;
          }
        });
      });
    });

    if (!lessonFound) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    await course.save();
    res.status(200).json({ message: "PDF added to lesson successfully" });
  } catch (err) {
    console.error("Add PDF to Lesson Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
