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
});

module.exports =
  mongoose.models.CareerAssessment ||
  mongoose.model("CareerAssessment", careerAssessmentSchema);
