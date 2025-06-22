const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const StudentSchema = new Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  rollNumber: { type: String, required: true, unique: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'course' }, // LINK
  branch: String,
  yearOfStudy: Number,
  collegecourse:String, // This can be used to store the course name if needed
  college: String,
  phoneNumber: String,
  address: String,
  skills: [String],
  scorecard: Number, // Array of scores for each module, , // Overall score
  hired: {
    isHired: { type: Boolean, default: false },
    companyName: String,
    hiredDate: Date,
  },
}); 

module.exports = mongoose.model("students", StudentSchema);