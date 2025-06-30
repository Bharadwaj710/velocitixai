const mongoose = require("mongoose");

const TranscriptSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  lessonId: { type: mongoose.Schema.Types.ObjectId, required: true },
  videoId: { type: String, required: true },
  transcript: { type: Array, default: [] }, // Array of { start, end, text }
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Transcript", TranscriptSchema);
