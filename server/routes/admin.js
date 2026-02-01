const express = require("express");
const router = express.Router();
const {
  getRecentNotifications,
  getAllNotifications,
  markAsRead,
  getAllUsers,
  getAllStudents,
  clearAllNotifications,
  getAllColleges,
  getAllHRs,
  getStudentFilters,
  getHRFilters,
  getAdminProfile,
  updateAdminProfile,
  deleteAdminProfile,
  getHiredStudents,
  getStudentDetailsForAdmin,
} = require("../controller/adminController");
const auth = require("../middleware/auth");
const multer = require("../middleware/multerConfig");
const Notification = require("../models/Notification");

router.get("/users", getAllUsers);
router.get("/students", getAllStudents);
router.get("/colleges", getAllColleges);
router.get("/hrs", getAllHRs);
router.get("/students/filters", getStudentFilters);
router.get("/hrs/filters", getHRFilters);
router.get("/notifications/recent", getRecentNotifications);
router.get("/notifications/all", getAllNotifications);
router.put("/notifications/:id/read", markAsRead);
router.delete("/notifications/clear", auth, clearAllNotifications);

router.get("/hired-students", getHiredStudents);
// ✅ Profile Settings Routes
router.get("/profile", auth, getAdminProfile);
router.put("/profile", auth, multer.single("image"), updateAdminProfile);
router.delete("/profile", auth, deleteAdminProfile);

router.get("/recent-activity", async (req, res) => {
  try {
    const notifications = await Notification.find({})
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});
router.get("/student/:userId", getStudentDetailsForAdmin);

module.exports = router;
