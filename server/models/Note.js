const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
  courseId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Course" },
  lessonTitle: { type: String, required: true },
  noteContent: { type: String, required: true },
  transcriptIdx: { type: Number },
  timestamp: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Note', noteSchema);
