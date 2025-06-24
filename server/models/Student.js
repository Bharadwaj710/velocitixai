const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const StudentSchema = new Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  enrollmentNumber: { type: String, required: true, unique: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'course' }, // LINK
  branch: String,
  yearOfStudy: Number,
  college: String, // Keep this if you still want the display name
  collegeSlug: { type: String, required: true }, // ✅ NEW FIELD
  phoneNumber: String,
  domain: String, // Domain of interest
  address: String,
  skills: [String],
  scorecard: Number,
  hired: {
    isHired: { type: Boolean, default: false },
    companyName: String,
    hiredDate: Date,
  },
  name :
  {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("students", StudentSchema);
