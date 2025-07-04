const mongoose = require("mongoose");

const QuizQuestionSchema = new mongoose.Schema({
  type: { type: String, enum: ["mcq", "text", "fill"], required: true },
  question: { type: String, required: true },
  options: [String], // Only for MCQ
  correctAnswer: { type: String },
  explanation: { type: String },
});

const QuizSchema = new mongoose.Schema({
  lessonId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true,
  },
  generated: { type: Boolean, default: false },
  questions: [QuizQuestionSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Quiz", QuizSchema);
