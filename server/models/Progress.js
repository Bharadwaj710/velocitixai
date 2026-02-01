const mongoose = require("mongoose");

// 🔹 Individual quiz result schema
const quizResultSchema = new mongoose.Schema({
  lessonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lesson",
    required: true,
  },
  answers: {
    type: [String], // student’s selected or written answers
    default: [],
  },
  feedback: {
    type: [String],
    default: [],
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  passed: {
    type: Boolean,
    required: true,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
});

// 🔹 Overall course progress schema
const progressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    completedLessons: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Lesson",
      default: [],
    },
    quizResults: {
      type: [quizResultSchema],
      default: [],
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // adds createdAt & updatedAt automatically
  }
);

// 🔁 Update `updatedAt` on every save
progressSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model("Progress", progressSchema);
