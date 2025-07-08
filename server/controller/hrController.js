const Student = require("../models/Student");
const HR = require("../models/HR");
const User = require("../models/User");
const Invitation = require("../models/Invitation");
const nodemailer = require("nodemailer");
const Course = require("../models/Course");
const Progress = require("../models/Progress");
const CareerAssessment = require("../models/CareerAssessment");

// ✅ Get all students (used in HR Dashboard)
const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find()
      .populate("user", "name email")
      .populate("course");

    const userIds = students.map((s) => s.user?._id).filter(Boolean);

    const assessments = await CareerAssessment.find({
      userId: { $in: userIds },
    }).lean();

    // Map userId => skills/domain
    const assessmentMap = {};
    for (const a of assessments) {
      assessmentMap[a.userId.toString()] = {
        domain: a.profile_analysis?.domain || a.domain || null,
        skills: Array.isArray(a.profile_analysis?.skills)
          ? a.profile_analysis.skills
          : [],
      };
    }

    const enrichedStudents = students.map((s) => {
      const assessment = assessmentMap[s.user?._id?.toString()] || {};
      return {
        ...s.toObject(),
        domain: assessment.domain || null,
        skills: assessment.skills || [],
      };
    });

    res.json({ success: true, students: enrichedStudents });
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const getStudentDetailsForHR = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findById(studentId)
      .populate("user", "name email")
      .populate("course");

    if (!student || !student.user) {
      return res.status(404).json({
        success: false,
        message: "Student or linked user not found",
      });
    }

    // 👇 Use .lean() to get raw object with profile_analysis
    const careerData = await CareerAssessment.findOne({
      userId: student.user._id,
    }).lean();

    const domain =
      careerData?.profile_analysis?.domain || careerData?.domain || null;

    const skills = Array.isArray(careerData?.profile_analysis?.skills)
      ? careerData.profile_analysis.skills
      : [];

    // 📊 Progress calculation
    const progressRecords = await Progress.find({ userId: student.user._id });
    const courseProgressMap = {};

    for (const course of student.course || []) {
      const progress = progressRecords.find(
        (p) => p.courseId.toString() === course._id.toString()
      );
      const completedLessons = progress?.completedLessons || [];
      let totalLessons = 0;

      for (const week of course.weeks || []) {
        for (const module of week.modules || []) {
          totalLessons += (module.lessons || []).length;
        }
      }

      const percent =
        totalLessons > 0
          ? Math.round((completedLessons.length / totalLessons) * 100)
          : 0;

      courseProgressMap[course._id] = percent;
    }

    // ✅ Return enriched student data
    return res.json({
      success: true,
      student: {
        ...student.toObject(),
        domain,
        skills,
      },
      courseProgressMap,
    });
  } catch (err) {
    console.error("Error fetching student full details:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ✅ Get HR profile details by user ID (for profile dropdown)
const getHRDetailsByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const hrDetails = await HR.findOne({ user: userId }).populate(
      "user",
      "name email"
    );

    if (!hrDetails) {
      return res.status(404).json({ success: false, message: "HR not found" });
    }

    res.status(200).json({ success: true, hr: hrDetails });
  } catch (error) {
    console.error("Error fetching HR details:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ✅ Send invitation email and store in DB
const sendInvite = async (req, res) => {
  try {
    const { studentId, companyName, hrId } = req.body;

    const student = await Student.findById(studentId).populate(
      "user",
      "email name"
    );
    if (!student || !student.user?.email) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    // Send email using nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Velocitix Hiring" <${process.env.EMAIL_USER}>`,
      to: student.user.email,
      subject: `You're Invited to Interview at ${companyName}`,
      html: `
        <p>Hi ${student.user.name},</p>
        <p>You have been invited by <strong>${companyName}</strong> for an interview opportunity through Velocitix.</p>
        <p>We look forward to connecting with you.</p>
        <p>Regards,<br/>Velocitix Team</p>
      `,
    });

    // Save invitation
    const invitation = new Invitation({
      student: studentId,
      hr: hrId,
      company: companyName,
    });
    await invitation.save();

    res
      .status(200)
      .json({ success: true, message: "Invitation sent and saved!" });
  } catch (error) {
    console.error("Failed to send invitation:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send invitation email",
      error: error.message,
    });
  }
};

// ✅ Get invited students from Invitation model (NEW fixed version)
const getInvitedStudents = async (req, res) => {
  try {
    const invitations = await Invitation.find()
      .populate({
        path: "student",
        populate: {
          path: "user",
          select: "name email",
        },
      })
      .populate({
        path: "hr",
        populate: {
          path: "user",
          select: "name email",
        },
      });

    const students = invitations.map((inv) => ({
      _id: inv._id,
      student: inv.student,
      hr: inv.hr,
      company: inv.company,
    }));

    res.json({ success: true, students });
  } catch (error) {
    console.error("Error fetching invited students:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  getAllStudents,
  getHRDetailsByUser,
  sendInvite,
  getInvitedStudents,
  getStudentDetailsForHR,
};
