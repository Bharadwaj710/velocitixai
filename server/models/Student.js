const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const StudentSchema = new Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  enrollmentNumber: { type: String, required: true, unique: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'course' }, // LINK
  branch: String,
  yearOfStudy: Number,
  college: String,
  phoneNumber: String,
  domain: String, // Domain of interest
  address: String,
  skills: [String],
  scorecard: Number, // Array of scores for each module, , // Overall score
  
}); 

module.exports = mongoose.model("students", StudentSchema);