const nodemailer = require("nodemailer");
const Student = require("../models/Student");
const User = require("../models/User");
const Invitation = require("../models/Invitation");

// POST /api/hr/send-invite
const sendHireInvite = async (req, res) => {
  try {
    const { studentId, companyName, hrId } = req.body;
    if (!studentId || !companyName || !hrId) {
      return res.status(400).json({ success: false, message: "Missing studentId, companyName, or hrId" });
    }
    // Find student and user email
    const student = await Student.findById(studentId).populate("user", "name email");
    if (!student || !student.user) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }
    const studentEmail = student.user.email;
    const studentName = student.user.name;

    // Save invitation to DB
    await Invitation.create({ student: studentId, hr: hrId });

    // Setup nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Email content
    const mailOptions = {
      from: `"Velocitix AI" <${process.env.EMAIL_USER}>`,
      to: studentEmail,
      subject: `You're Invited to Interview at ${companyName}!`,
      html: `<p>Hi ${studentName},</p>
        <p>Congratulations! <b>${companyName}</b> would like to invite you for an interview. Please reply to this email to schedule your interview or for more details.</p>
        <p>Best regards,<br/>Velocitix AI Team</p>`
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: "Invitation email sent successfully" });
  } catch (error) {
    console.error("Error sending hire invitation:", error);
    res.status(500).json({ success: false, message: "Failed to send invitation email" });
  }
};

// Get all invited students for an HR
const getInvitedStudents = async (req, res) => {
  try {
    const { hrId } = req.params;
    const invitations = await Invitation.find({ hr: hrId })
      .populate({
        path: 'student',
        populate: { path: 'user', select: 'name email' }
      })
      .sort({ invitedAt: -1 });
    res.json({ success: true, invitations });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch invited students" });
  }
};

// Delete an invited student
const deleteInvitedStudent = async (req, res) => {
  try {
    const { invitationId } = req.params;
    await Invitation.findByIdAndDelete(invitationId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete invitation" });
  }
};

module.exports = { sendHireInvite, getInvitedStudents, deleteInvitedStudent };
