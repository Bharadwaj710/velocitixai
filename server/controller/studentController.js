const Student = require("../models/Student");
const mongoose = require("mongoose");

exports.saveStudentDetails = async (req, res) => {
  try {
    const {
      user,
      rollNumber,
      collegecourse,
      branch,
      yearOfStudy,
      college,
      phoneNumber,
      address,
    } = req.body;

    if (!user || !rollNumber || !collegecourse) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    // Check if student already exists for this user
    let student = await Student.findOne({ user });

    if (student) {
      // ⚠️ Check if another student has the same roll number
      if (student.rollNumber !== rollNumber) {
        const existingRoll = await Student.findOne({ rollNumber });
        if (existingRoll && existingRoll.user.toString() !== user) {
          return res.status(400).json({ message: "Roll number already exists" });
        }
      }

      // Update fields
      student.rollNumber = rollNumber;
      student.collegecourse = collegecourse;
      student.branch = branch;
      student.yearOfStudy = yearOfStudy;
      student.college = college;
      student.phoneNumber = phoneNumber;
      student.address = address;
      await student.save();

      return res.json({ message: "Student details updated", student });
    }

    // ⚠️ Also check roll number before creating new
    const duplicate = await Student.findOne({ rollNumber });
    if (duplicate) {
      return res.status(400).json({ message: "Roll number already exists" });
    }

    // Create new
    student = new Student({
      user,
      rollNumber,
      collegecourse,
      branch,
      yearOfStudy,
      college,
      phoneNumber,
      address,
    });

    await student.save();
    res.status(201).json({ message: "Student details saved", student });

  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
};

exports.getStudentDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ message: "User ID required" });
    const student = await Student.findOne({ user: userId });
    if (!student) return res.json({});
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
};
