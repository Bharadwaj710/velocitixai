const express = require("express");
const router = express.Router();
const CareerAssessment = require("../models/CareerAssessment");

// GET /api/assessments/filters
router.get("/filters", async (req, res) => {
  try {
    const assessments = await CareerAssessment.find({});
    const domains = Array.from(new Set(assessments.map(a => a.domain).filter(Boolean)));
    // Extract skills from answers (assuming skills are in answers)
    let skills = [];
    assessments.forEach(a => {
      if (Array.isArray(a.answers)) {
        a.answers.forEach(ans => {
          if (ans.questionType === "skill" && ans.answer) {
            if (Array.isArray(ans.answer)) {
              skills.push(...ans.answer);
            } else {
              skills.push(ans.answer);
            }
          }
        });
      }
    });
    skills = Array.from(new Set(skills.filter(Boolean)));
    res.json({ domains, skills });
  } catch (err) {
    res.status(500).json({ message: "Server error", details: err.message });
  }
});

module.exports = router;
