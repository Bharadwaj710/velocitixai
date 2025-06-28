const mongoose = require('mongoose');

// 🔹 Lesson Schema
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

// 🔹 Module Schema
const moduleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String, // Description of what the module covers
  },
  lessons: [lessonSchema] // Each module has lessons
});

// 🔹 Week Schema
const weekSchema = new mongoose.Schema({
  weekNumber: {
    type: Number,
    required: true,
  },
  modules: [moduleSchema] // Each week has modules
});

// 🔹 Course Schema
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

  weeks: [weekSchema], // ✅ NEW STRUCTURE HERE
  
}, {
  timestamps: true
});

const Course = mongoose.model('Course', courseSchema);
module.exports = Course;
