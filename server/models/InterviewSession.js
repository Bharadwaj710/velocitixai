const mongoose = require("mongoose");

const InterviewSessionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    videoUrl: String,
    timestamps: [
      {
        question: Number,
        start: Number,
        end: Number,
      },
    ],
    questions: [
      {
        index: Number,
        question: String,
      },
    ],
    answers: [
      {
        index: Number,
        answer: String,
      },
    ],
    skippedQuestions: [
      {
        index: Number,
        question: String,
      },
    ],
    notAttemptedQuestions: [
      {
        index: Number,
        question: String,
      },
    ],
    lastGeneratedQuestion: {
      index: Number,
      question: String,
    },

    status: {
      type: String,
      enum: ["in-progress", "completed", "terminated"],
      default: "in-progress",
    },
    cheatingDetected: { type: Boolean, default: false },
    report: {
      confidenceScore: Number,
      subjectKnowledgeScore: Number,
      domainKnowledge: String,
      professionalism: String,
      summary: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("InterviewSession", InterviewSessionSchema);
