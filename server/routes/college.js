const express = require("express");
const router = express.Router();
const Student = require("../models/Student");

router.get("/students/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const students = await Student.find({ collegeSlug: slug });
    res.json({ success: true, students });
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
