const mongoose = require("mongoose");

const ResourceSchema = new mongoose.Schema({
  url: String,
  name: String,
}, { _id: false });

const ModuleSchema = new mongoose.Schema({
  title: String,
  content: String,
  resources: [ResourceSchema],
});

const CourseSchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true },
  description: String,
  durationWeeks: Number,
  modules: [ModuleSchema],
  level: { type: String, enum: ["Beginner", "Intermediate", "Proficient"], default: "Beginner" },
  domain: { type: String, required: true }, // AI-required
  idealRoles: [{ type: String, required: true }], // AI-required
  skillsCovered: [{ type: String, required: true }], // AI-required
  challengesAddressed: [{ type: String, required: true }], // AI-required
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
  },
});

module.exports = mongoose.model("course", CourseSchema);
module.exports = mongoose.model("course", CourseSchema);
