const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const mongoose = require("mongoose");
const CareerAssessment = require("../models/CareerAssessment");
const User = require("../models/User");

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

// POST /api/assessment/submit
router.post(
  "/submit",
  upload.fields([
    { name: "question3Video", maxCount: 1 },
    { name: "question5Audio", maxCount: 1 },
  ]),
  async (req, res) => {
    console.log("[Assessment] POST /api/assessment/submit called");
    console.log("[Assessment] req.body:", req.body);
    console.log("[Assessment] req.files:", req.files);
    try {
      const { question1, question2, question4, userId } = req.body;
      // Log all incoming values
      console.log("[Assessment] userId:", userId);
      console.log("[Assessment] question1:", question1);
      console.log("[Assessment] question2:", question2);
      console.log("[Assessment] question4:", question4);
      // Validate userId
      if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        console.error("[Assessment] Invalid or missing userId");
        return res.status(400).json({ error: "Invalid or missing userId" });
      }
      // Check if user exists
      const userExists = await User.findById(userId);
      if (!userExists) {
        console.error("[Assessment] No user found for userId:", userId);
        return res.status(404).json({ error: "User not found" });
      }
      if (!question1 || !question2 || !question4) {
        console.error("[Assessment] Missing required fields");
        return res.status(400).json({ error: "Missing required fields" });
      }
      const question3VideoPath = req.files["question3Video"]?.[0]?.path || "";
      const question5AudioPath = req.files["question5Audio"]?.[0]?.path || "";
      console.log("[Assessment] question3VideoPath:", question3VideoPath);
      console.log("[Assessment] question5AudioPath:", question5AudioPath);
      const assessmentData = {
        user: userId,
        question1,
        question2,
        question4,
        question3VideoPath,
        question5AudioPath,
      };
      console.log(
        "[Assessment] Creating CareerAssessment with data:",
        assessmentData
      );
      try {
        const newAssessment = new CareerAssessment(assessmentData);
        const saved = await newAssessment.save();
        console.log("[Assessment] Assessment saved successfully:", saved);
        return res
          .status(200)
          .json({ message: "Assessment submitted successfully" });
      } catch (saveErr) {
        console.error("[Assessment] Error saving assessment:", saveErr);
        return res
          .status(500)
          .json({
            error: "Failed to save assessment",
            details: saveErr.message,
          });
      }
    } catch (error) {
      console.error("[Assessment] Unexpected error:", error);
      return res
        .status(500)
        .json({ error: "Unexpected server error", details: error.message });
    }
  }
);

module.exports = router;
