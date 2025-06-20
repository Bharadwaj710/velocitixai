const mongoose = require("mongoose");

const ResourceSchema = new mongoose.Schema({
  url: String,
  name: String,
}, { _id: false }); // avoid extra _id for subdocs

const ModuleSchema = new mongoose.Schema({
  title: String,
  content: String,
  resources: [ResourceSchema], // ✅ Accepts array of {url, name}
});

const CourseSchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true },
  description: String,
  durationWeeks: Number,
  modules: [ModuleSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
  },
});

module.exports = mongoose.model("course", CourseSchema);
