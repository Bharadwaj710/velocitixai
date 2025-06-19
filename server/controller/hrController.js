const Student = require("../models/Student");
const HR = require("../models/HR");
const User = require("../models/User");

const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find().populate("user", "name email"); 
    res.json({ success: true, students });
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const getHRDetailsByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const hrDetails = await HR.findOne({ user: userId }).populate("user", "name email");

    if (!hrDetails) {
      return res.status(404).json({ success: false, message: "HR not found" });
    }

    res.status(200).json({ success: true, hr: hrDetails });
  } catch (error) {
    console.error("Error fetching HR details:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
module.exports = {
  getAllStudents,
  getHRDetailsByUser,
};
