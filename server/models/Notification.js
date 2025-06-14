// ✅ Notification Model (models/Notification.js)
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  message: { type: String, required: true },
  type: { type: String, enum: ["student", "college", "hr", "system"], default: "system" },
  extraData: { type: Object, default: {} },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Notifications", notificationSchema);
