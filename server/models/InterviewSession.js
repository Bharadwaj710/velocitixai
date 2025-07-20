// server/models/InterviewSession.js
const mongoose = require("mongoose");

const InterviewSessionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    videoUrl: String,
    answers: [String],
    timestamps: [
      {
        question: Number,
        start: Number,
        end: Number,
      },
    ],
    status: {
      type: String,
      enum: ["completed", "terminated"],
      default: "completed",
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
