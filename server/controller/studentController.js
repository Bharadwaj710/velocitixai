const Student = require("../models/Student");
const mongoose = require("mongoose");

exports.saveStudentDetails = async (req, res) => {
  try {
    const {
      user,
      enrollmentNumber,
      course,
      branch,
      yearOfStudy,
      college,
      collegeSlug,  // ✅ new field
      phoneNumber,
      domain,
      address,
      skills,
    } = req.body;

    if (!user || !enrollmentNumber || !course || !collegeSlug) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    // If course is a string, try to find course by title, else use as ObjectId
    let courseId = course;
    if (
      typeof course === "string" &&
      !mongoose.Types.ObjectId.isValid(course)
    ) {
      const Course = require("../models/Course");
      const foundCourse = await Course.findOne({ title: course });
      if (foundCourse) courseId = foundCourse._id;
      else courseId = undefined;
    }

    // Check if student already exists for this user
    let student = await Student.findOne({ user });
    const User = require("../models/User");
    const userDoc = await User.findById(user);
    const userName = userDoc ? userDoc.name : undefined;

    if (student) {
      // Update existing
      student.enrollmentNumber = enrollmentNumber;
      student.course = courseId;
      student.branch = branch;
      student.yearOfStudy = yearOfStudy;
      student.college = college;
      student.collegeSlug = collegeSlug;  // ✅ store slug
      student.phoneNumber = phoneNumber;
      student.domain = domain;
      student.address = address;
      student.skills = Array.isArray(skills) ? skills : [];
      if (userName) student.name = userName; // auto-fill name
      await student.save();
      return res.json({ message: "Student details updated", student });
    }

    // Create new
    student = new Student({
      user,
      name: userName, // auto-fill name
      enrollmentNumber,
      course: courseId,
      branch,
      yearOfStudy,
      college,
      collegeSlug,  // ✅ store slug
      phoneNumber,
      domain,
      address,
      skills: Array.isArray(skills) ? skills : [],
    });

    await student.save();
    res.status(201).json({ message: "Student details saved", student });
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(400)
        .json({ message: "Enrollment number already exists" });
    }
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
