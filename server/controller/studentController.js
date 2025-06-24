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

    const student = await Student.findOne({ user: userId }).populate("course");
    if (!student || !student.course) {
      return res.status(404).json({ message: "No course found for student" });
    }

    const totalModules = Array.isArray(student.course.modules) ? student.course.modules.length : 0;
    const completedModules = Array.isArray(student.scorecard)
      ? student.scorecard.length
      : typeof student.scorecard === "number"
      ? student.scorecard
      : 0;

    const progressPercent = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

    const assessment = await CareerAssessment.findOne({ userId });
    let readinessPercent = null;
    let readinessDetails = null;

    if (assessment) {
      if (typeof assessment.readiness_score === "number") {
        readinessPercent = assessment.readiness_score;

        if (assessment.profile_analysis) {
          const pa = assessment.profile_analysis;
          readinessDetails = {
            confidenceScore: pa.confidenceScore || pa.confidence_score || "",
            communicationClarity: pa.communicationClarity || pa.communication_clarity || "",
            tone: pa.tone || "",
            toneScore: pa.toneScore || pa.tone_score || "",
          };
        }
      } 
    }

    res.json({
      courseTitle: student.course.title,
      progressPercent,
      completedModules,
      totalModules,
      readinessPercent,
      readinessDetails,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
};

