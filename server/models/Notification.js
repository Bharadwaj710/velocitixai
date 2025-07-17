const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  type: { type: String, required: true }, // e.g. 'new_course', 'course_added'
  message: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", default: null },
  forRole: {
    type: String,
    enum: ["admin", "student", "hr", null],
    default: "student",
  },
  createdAt: { type: Date, default: Date.now },
  meta: { type: Object },
});

module.exports = mongoose.model("notifications", notificationSchema);
