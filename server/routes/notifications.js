const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");

// POST: Add a notification
router.post("/", async (req, res) => {
  try {
    const { type, message, userId, meta, forRole } = req.body;
    const newNotification = new Notification({
      type,
      message,
      userId: userId || null,
      forRole: userId ? null : forRole, // Avoid storing both
      meta,
    });

    await newNotification.save();
    res.status(201).json(newNotification);
  } catch (error) {
    res.status(500).json({ message: "Error creating notification" });
  }
});

// ✅ Get only new_course notifications for a specific student
// GET notifications by userId (for student) or forRole (admin)
router.get("/user/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    const notifications = await Notification.find({
      $or: [
        { userId }, // personalized
        { userId: null, forRole: "student" }, // global for students
      ],
    }).sort({ createdAt: -1 });

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user notifications" });
  }
});

router.get("/role/:role", async (req, res) => {
  try {
    const notifications = await Notification.find({
      $and: [
        { userId: null }, // 💥 Only global notifications
        {
          $or: [{ forRole: "admin" }, { type: "admin_new_course" }],
        },
      ],
    }).sort({ createdAt: -1 });

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Error fetching role notifications" });
  }
});

// Remove a specific notification
router.delete("/:notificationId", async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.notificationId);
    res.json({ message: "Notification removed" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting notification" });
  }
});

// Optional: Clear all notifications for a student
router.delete("/clear/:studentId", async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.params.studentId });
    res.json({ message: "All notifications cleared" });
  } catch (error) {
    res.status(500).json({ message: "Error clearing notifications" });
  }
});
// ✅ Delete notification by studentId and courseId
router.delete("/remove/:studentId/:courseId", async (req, res) => {
  try {
    await Notification.deleteMany({
      userId: req.params.studentId,
      "meta.courseId": req.params.courseId,
    });
    res.json({ message: "Notification for course removed" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting notification" });
  }
});

module.exports = router;
