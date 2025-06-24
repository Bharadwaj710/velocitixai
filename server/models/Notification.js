// ✅ Notification Model (models/Notification.js)
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  type: { type: String, required: true }, // e.g., "user_registered"
  message: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
  createdAt: { type: Date, default: Date.now },
  meta: { type: Object }, // Any extra info
});

module.exports = mongoose.model("notifications", notificationSchema);
