// models/Course.js
const mongoose = require("mongoose");

const CourseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  durationWeeks: Number,
  modules: [
    {
      title: String,
      content: String,
      resources: [String] // URLs or file references
    }
  ],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user' // admin
  }
}); 

module.exports = mongoose.model("course", CourseSchema);
