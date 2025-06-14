const User = require("../models/User");

// GET /api/users - fetch all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// PUT /api/users/:id - update user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, isAdmin } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { name, email, role, isAdmin },
      { new: true, runValidators: true, context: "query" }
    ).select("-password");
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
    if (!deleted) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete user' });
  }
};

// GET /api/stats/overview
const getOverviewStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeStudents = await User.countDocuments({ role: 'student' });
    const partnerColleges = await User.countDocuments({ role: 'college' });
    const activeHRs = await User.countDocuments({ role: 'hr'});
    res.json({
      totalUsers,
      activeStudents,
      partnerColleges,
      activeHRs
    });
  } catch (err) {
    console.error('Failed to fetch overview stats:', err);
    res.status(500).json({ message: 'Failed to fetch overview stats' });
  }
};

module.exports = { getAllUsers, updateUser, deleteUser, getOverviewStats };
