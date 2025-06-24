const User = require("../models/User");
const College = require("../models/College");
const Student = require('../models/Student');

// In collegeController.js
const getStudentsByCollege = async (req, res) => {
  const { slug } = req.params;

  try {
    const college = await College.findOne({ slug });

    if (!college) {
      return res.status(404).json({ message: "College not found", success: false });
    }

    const students = await Student.find({ collegeSlug: slug }).populate("user", "name email"); // 👈 Important
    console.log("Fetched students:", JSON.stringify(students, null, 2)); // 👈 add this
    res.status(200).json({ success: true, students });
  } catch (err) {
    console.error("Error fetching students:", err);
    res.status(500).json({ message: "Internal server error", success: false });
  }
};


// Onboard a new college and update user's collegeSlug
const onboardCollege = async (req, res) => {
  try {
    const { userId, name, address, establishedYear, accreditation, contact } = req.body;
    console.log("onboardCollege called with:", req.body);

    if (!userId || !name) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const slug = name.toLowerCase().replace(/\s+/g, '-');

    const college = await College.create({
      user: userId,
      name,
      slug,
      address,
      establishedYear,
      accreditation,
      contact
    });

    const updated = await User.findByIdAndUpdate(userId, { collegeSlug: slug }, { new: true });
    console.log("College created. User updated:", updated);

    res.status(201).json({ success: true, college, slug });
  } catch (err) {
    console.error("Error onboarding college:", err);
    if (err.stack) console.error(err.stack);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};


module.exports = {
  getStudentsByCollege,
  onboardCollege
};
