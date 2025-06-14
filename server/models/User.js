const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  role: {
    type: String,
    enum: ["student", "admin", "hr", "college"],
    default: "student",
  },
 collegeSlug: {
    type: String,
    required: function () {
      return this.role === "student" || this.role === "college";
    }
  }
});
module.exports = mongoose.model("user", UserSchema,"user");