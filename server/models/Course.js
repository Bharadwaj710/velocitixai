const mongoose = require("mongoose");
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
  videoId: {
    type: String, // <-- Add this field
    required: false,
  },
  duration: {
    type: String, // Optional, e.g., "12:34"
  },
  quizEnabled: { type: Boolean, default: true },
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
  lessons: [lessonSchema], // Each module has lessons
});

// 🔹 Week Schema
const weekSchema = new mongoose.Schema({
  weekNumber: {
    type: Number,
    required: true,
  },
  modules: [moduleSchema], // Each week has modules
});

// 🔹 Course Schema
const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: String,
    durationWeeks: Number,
    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Proficient"],
      default: "Beginner",
    },
    domain: { type: String, required: true }, // AI-required
    idealRoles: [{ type: String, required: true }], // AI-required
    skillsCovered: [{ type: String, required: true }], // AI-required
    challengesAddressed: [{ type: String, required: true }], // AI-required
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    timeCommitmentRecommended: String,

    weeks: [weekSchema], // ✅ NEW STRUCTURE HERE
  },
  {
    timestamps: true,
  }
);

// Ensure the model name is "Course" (capital C, singular) for Mongoose population compatibility
module.exports = mongoose.model("Course", courseSchema);
