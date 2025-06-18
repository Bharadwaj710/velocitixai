const mongoose = require("mongoose");

const CareerAssessmentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  question1: { type: String, required: true },
  question2: { type: String, required: true },
  question3VideoPath: { type: String },
  question4: { type: String, required: true },
  question5AudioPath: { type: String },
  submittedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("CareerAssessment", CareerAssessmentSchema);
