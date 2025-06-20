const mongoose = require("mongoose");

const careerAssessmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  domain: {
    type: String,
    required: true,
  },
  answers: [
    {
      questionNumber: Number,
      questionText: String,
      questionType: String, // "mcq", "text", "paragraph", "checkbox", "file"
      answer: mongoose.Schema.Types.Mixed,
    },
  ],
  submittedAt: {
    type: Date,
    default: Date.now,
  },

  // ✅ New field: Gemini AI profile output (structured)
  profile_analysis: {
    domain: String,
    level: String,
    skills: [String],
    preferredLearningStyle: [String],
    desiredRole: String,
    challenges: [String],
  },

  // ✅ New field: Cached recommended courses from AI
  recommended_courses: [
    {
      title: String,
      description: String,
      durationWeeks: Number,
      level: String,
      domain: String,
      idealRoles: [String],
      skillsCovered: [String],
      challengesAddressed: [String],
      learningStyleFit: [String],
      timeCommitmentRecommended: String,
      modules: [
        {
          title: String,
          content: String,
          resources: [
            {
              url: String,
              name: String,
            },
          ],
        },
      ],
    },
  ],
});

module.exports = mongoose.model("CareerAssessment", careerAssessmentSchema);
