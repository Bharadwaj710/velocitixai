const User = require("../models/User");
const College = require("../models/College");

const getStudentsByCollege = async (req, res) => {
  const { slug } = req.params;

  try {
    const college = await College.findOne({ slug });

    if (!college) {
      return res.status(404).json({ message: "College not found", success: false });
    }

    const students = await User.find({ collegeSlug: slug, role: "student" });

    res.status(200).json({ success: true, students });
  } catch (err) {
    console.error("Error fetching students:", err);
    res.status(500).json({ message: "Internal server error", success: false });
  }
};

module.exports = {
  getStudentsByCollege
};
