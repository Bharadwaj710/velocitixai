const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const CareerAssessment = require("../models/CareerAssessment");
const User = require("../models/User");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "_" + file.originalname),
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
});

router.post("/", upload.single("file"), async (req, res) => {
  try {
    const { userId, domain } = req.body;
    let answers = req.body.answers;

    if (!userId || !domain || !answers) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!Array.isArray(answers)) {
      try {
        answers = JSON.parse(answers);
      } catch (e) {
        return res.status(400).json({ error: "Invalid answers format" });
      }
    }

    // Validate user
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ error: "User not found" });
    }

    // If file uploaded, inject file path into Q10
    if (req.file) {
      const filePath = `/uploads/${req.file.filename}`;
      const q10Index = answers.findIndex((a) => a.questionNumber === 10);
      if (q10Index !== -1) {
        answers[q10Index].answer = filePath;
      } else {
        answers.push({
          questionNumber: 10,
          questionText:
            "Upload a 1-minute video or audio introducing yourself and your career goal.",
          questionType: "file",
          answer: filePath,
        });
      }
    }

    // Update existing or insert new (upsert)
    const doc = await CareerAssessment.findOneAndUpdate(
      { userId },
      {
        $set: {
          domain,
          answers,
          submittedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: "Assessment submitted", doc });
  } catch (err) {
    console.error("[CareerAssessment] Error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});  

module.exports = router;
