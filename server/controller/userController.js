const User = require("../models/User");
const bcrypt = require("bcryptjs");

// GET /api/users - fetch all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// PUT /api/users/:id - update user (with image upload)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    let updateFields = {};
    if (req.body.name) updateFields.name = req.body.name;
    if (req.body.email) updateFields.email = req.body.email;
    if (req.body.role) updateFields.role = req.body.role;
    if (req.body.isAdmin !== undefined) updateFields.isAdmin = req.body.isAdmin;
    if (req.file) {
      updateFields.profilePicture = "/uploads/" + req.file.filename;
    }
    const updatedUser = await User.findByIdAndUpdate(id, updateFields, {
      new: true,
      runValidators: true,
      context: "query",
    }).select("-password");
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// DELETE /api/users/:id
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete user" });
  }
};

// GET /api/stats/overview
const getOverviewStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeStudents = await User.countDocuments({ role: "student" });
    const partnerColleges = await User.countDocuments({ role: "college" });
    const activeHRs = await User.countDocuments({ role: "hr" });
    res.json({
      totalUsers,
      activeStudents,
      partnerColleges,
      activeHRs,
    });
  } catch (err) {
    console.error("Failed to fetch overview stats:", err);
    res.status(500).json({ message: "Failed to fetch overview stats" });
  }
};

// GET /api/users/:id - fetch single user
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Get user by ID failed:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
// PUT /api/users/change-password/:id
const changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Old password is incorrect" });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to change password" });
  }
};

module.exports = {
  getAllUsers,
  updateUser,
  deleteUser,
  getOverviewStats,
  getUserById,
  changePassword,
};
