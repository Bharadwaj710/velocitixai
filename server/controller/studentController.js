const Student = require("../models/Student");
const mongoose = require("mongoose");
const Course = require("../models/Course");
const CareerAssessment = require("../models/CareerAssessment");
const axios = require("axios");

exports.saveStudentDetails = async (req, res) => {
  try {
    const {
      user,
      rollNumber,
      collegecourse,
      branch,
      yearOfStudy,
      college,
      collegeSlug,  // ✅ new field
      phoneNumber,
      address,
    } = req.body;


    if (!user || !rollNumber || !collegecourse || !collegeSlug) {

      return res.status(400).json({ message: "Required fields missing" });
    }

    // Check if student already exists for this user
    let student = await Student.findOne({ user });

    const User = require("../models/User");
    const userDoc = await User.findById(user);
    const userName = userDoc ? userDoc.name : undefined;


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
      student.collegeSlug = collegeSlug;  // ✅ store slug
      student.phoneNumber = phoneNumber;
      student.address = address;

      
      if (userName) student.name = userName; // auto-fill name

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
      name: userName,
      rollNumber,
      collegecourse,

      branch,
      yearOfStudy,
      college,
      collegeSlug,  // ✅ store slug
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



exports.enrollCourse = async (req, res) => {
  const { userId, courseId } = req.body;
  console.log("Received enroll request:", { userId, courseId });

  // Fix: Ensure courseId is a valid ObjectId and not undefined/empty/null/array/object
  if (
    !userId ||
    !courseId ||
    typeof courseId !== "string" ||
  ! 
    courseId === "" ||
    Array.isArray(courseId) ||
    typeof courseId === "object"
  ) {
    return res.status(400).json({ error: "Missing or invalid userId or courseId" });
  }

  try {
    let student = await Student.findOne({ user: userId });

    if (!student) {
      // Create student if not exists
      student = new Student({ user: userId, course: [courseId] });
    } else {
      // Avoid duplicates (convert ObjectId to string for comparison)
      const courseIdStr = courseId.toString();
      const hasCourse = student.course.some(
        (c) => c.toString() === courseIdStr
      );
      if (!hasCourse) {
        student.course.push(courseId);
      }
    }

    await student.save();
    res.json({ message: "Course enrolled", student });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.unenrollCourse = async (req, res) => {
  const { userId, courseId } = req.body;

  if (!userId || !courseId) {
    return res.status(400).json({ error: "Missing userId or courseId" });
  }

  try {
    const student = await Student.findOne({ user: userId });
    if (!student) return res.status(404).json({ error: "Student not found" });

    student.course = student.course.filter((c) => c.toString() !== courseId);
    await student.save();

    res.json({ message: "Course unenrolled", student });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getEnrolledCourses = async (req, res) => {
  const { userId } = req.params;

  try {
    const student = await Student.findOne({ user: userId }).populate("course");
    if (!student) return res.json([]);
    res.json(student.course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getStudentLearningProgress = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId)
      return res.status(400).json({ message: "User ID is required" });

    const assessment = await CareerAssessment.findOne({ userId });

    let readinessPercent = null;
    let readinessDetails = null;
    let level = "Beginner";

    if (assessment) {
      const pa = assessment.profile_analysis || {};
      const confidence = Number(pa.confidenceScore || pa.confidence_score || 0);
      const communication = Number(
        pa.communicationClarity || pa.communication_clarity || 0
      );
      const tone = (pa.tone || "").toLowerCase();

      let toneScore = 0;
      if (tone === "confident" || tone === "passionate") toneScore = 10;
      else if (tone === "intermediate" || tone === "neutral") toneScore = 7;
      else if (tone === "hesitant") toneScore = 5;
      else if (tone === "unsure") toneScore = 3;

      const scores = [confidence, communication, toneScore].filter(
        (v) => v > 0
      );
      if (scores.length > 0) {
        readinessPercent = Math.round(
          (scores.reduce((a, b) => a + b, 0) / (scores.length * 10)) * 100
        );

        // Infer level based on score
        if (readinessPercent >= 80) level = "Proficient";
        else if (readinessPercent >= 50) level = "Intermediate";
        else level = "Beginner";

        readinessDetails = {
          confidenceScore: confidence,
          communicationClarity: communication,
          tone,
          toneScore,
        };
      }
    }

    res.json({
      readinessPercent,
      readinessDetails,
      level,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
};

