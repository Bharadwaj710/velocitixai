const express = require("express");
const router = express.Router();
const Student = require("../models/Student");
const { onboardCollege } = require("../controller/collegeController");

router.get("/students/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const students = await Student.find({ collegeSlug: slug })
      .populate("course")
      .populate("user"); // Also populate user for email
    res.json({ success: true, students });
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Onboard college
router.post("/onboard", onboardCollege);

module.exports = router;
