// server/models/InterviewReport.js
const mongoose = require("mongoose");

const scoreSchema = new mongoose.Schema({
  toneConfidence: { type: Number, min: 0, max: 100, required: true },
  communication: { type: Number, min: 0, max: 100, required: true },
  technical: { type: Number, min: 0, max: 100, required: true },
  softSkills: { type: Number, min: 0, max: 100, required: true },
  eyeContact: { type: Number, min: 0, max: 100, required: true },
  total: { type: Number, min: 0, max: 100, required: true },
});

const perQuestionSchema = new mongoose.Schema({
  index: { type: Number, required: true },
  question: { type: String, required: true },
  answer: { type: String },
  scores: {
    toneConfidence: Number,
    communication: Number,
    technical: Number,
    softSkills: Number,
    eyeContact: Number,
  },
  feedback: String,
});

const interviewReportSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InterviewSession",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    videoUrl: { type: String, required: true }, // ✅ new
    overallScores: scoreSchema,
    perQuestion: [perQuestionSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("InterviewReport", interviewReportSchema);
