const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  videoUrl: {
    type: String,
    required: true,
  },
  duration: {
    type: String, // Optional, e.g., "12:34"
  }
});

const moduleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String, // Description of what the module covers
  },
  lessons: [lessonSchema] // 🔥 Each module now has multiple lessons!
});

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  durationWeeks: Number,
  level: String,
  domain: String,
  idealRoles: [String],
  skillsCovered: [String],
  challengesAddressed: [String],
  learningStyleFit: [String],
  timeCommitmentRecommended: String,
  modules: [moduleSchema] // ✅ List of modules (with lessons inside!)
}, {
  timestamps: true
});

const Course = mongoose.model('Course', courseSchema);
module.exports = Course;
