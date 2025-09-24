const mongoose = require("mongoose");

const InterviewSessionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
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

    // 👇 Added fields
    cheatingDetected: { type: Boolean, default: false },
    cheatingWarning: { type: Boolean, default: false },
    cheatingAttempts: { type: Number, default: 3 },

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
