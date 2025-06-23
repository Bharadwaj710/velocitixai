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
      } else {
        try {
          // Call Flask only if readiness_score not cached
          console.log("Fetching recommendation from Flask...");
          const flaskResponse = await axios.post("http://localhost:5001/recommend", {
            student_id: userId,
          });

          if (flaskResponse.data && flaskResponse.data.profile_analysis) {
            const pa = flaskResponse.data.profile_analysis;

            const confidence = Number(pa.confidenceScore || pa.confidence_score || 0);
            const communication = Number(pa.communicationClarity || pa.communication_clarity || 0);
            let toneScore = 0;
            const tone = (pa.tone || "").toLowerCase();

            if (tone === "confident" || tone === "passionate") toneScore = 10;
            else if (tone === "intermediate" || tone === "neutral") toneScore = 7;
            else if (tone === "hesitant") toneScore = 5;
            else if (tone === "unsure") toneScore = 3;

            const scores = [confidence, communication, toneScore].filter((v) => v > 0);
            readinessPercent = Math.round((scores.reduce((a, b) => a + b, 0) / (scores.length * 10)) * 100);

            readinessDetails = { confidenceScore: confidence, communicationClarity: communication, tone, toneScore };

            assessment.readiness_score = readinessPercent;
            await assessment.save();
          }
        } catch (err) {
          console.error("Flask API error:", err.message);
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