const Student = require("../models/Student");
const HR = require("../models/HR");
const User = require("../models/User");
const Invitation = require("../models/Invitation");
const nodemailer = require("nodemailer");

// ✅ Get all students (used in HR Dashboard)
const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find().populate("user", "name email");
    res.json({ success: true, students });
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ✅ Get HR profile details by user ID (for profile dropdown)
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

// ✅ Send invitation email and store in DB
const sendInvite = async (req, res) => {
  try {
    const { studentId, companyName, hrId } = req.body;

    const student = await Student.findById(studentId).populate("user", "email name");
    if (!student || !student.user?.email) {
      return res.status(404).json({ success: false, message: "Student not found" });
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

    res.status(200).json({ success: true, message: "Invitation sent and saved!" });
  } catch (error) {
    console.error("Failed to send invitation:", error);
    res.status(500).json({ success: false, message: "Failed to send invitation email", error: error.message });
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
          select: "name email"
        }
      })
      .populate({
        path: "hr",
        populate: {
          path: "user",
          select: "name email"
        }
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
};
