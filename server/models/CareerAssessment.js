const mongoose = require("mongoose");

const careerAssessmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  domain: { type: String, required: true },
  answers: [
    {
      questionNumber: Number,
      questionText: String,
      questionType: String, // "mcq", "text", "paragraph", "checkbox", "file"
      answer: mongoose.Schema.Types.Mixed,
    },
  ],
  submittedAt: { type: Date, default: Date.now },
  profile_analysis: {
    confidence_score: Number,
    communication_clarity: Number,
    tone: String,
    keywords: [String],
    corrected_level: String,
  },
  video_transcript: String,
  video_feedback: String,
  eye_contact_percent: Number,
  corrected_level: String,
  isProcessed: { type: Boolean, default: false },
  recommended_courses: [mongoose.Schema.Types.Mixed],
  transcript: String, // Deprecated, kept for safety
});

module.exports =
  mongoose.models.CareerAssessment ||
  mongoose.model("CareerAssessment", careerAssessmentSchema);
