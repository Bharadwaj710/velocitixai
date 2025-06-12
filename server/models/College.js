const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CourseSchema = new Schema({
  name: String,
  duration: Number, // in years
  type: {
    type: String,
    enum: ["UG", "PG", "Diploma", "PhD"],
    default: "UG"
  }
}, { _id: false });

const CollegeSchema = new Schema({

  user: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  name: {
    type: String,
    required: true,
    unique: true
  },
=======
  name: { type: String, required: true, unique: true },

  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    pinCode: String
  },
  establishedYear: {
    type: Number,
    default: 2000
  },
  accreditation: {
    type: String,
    enum: ['A++', 'A+', 'A', 'B++', 'B+', 'B', 'C', 'Not Accredited'],
    default: 'Not Accredited'
  },
  contact: {
    email: String,
    phone: String,
    website: String
  },
  courses: [CourseSchema],
  status: {
    type: String,
    enum: ["pending", "active", "suspended"],
    default: "pending"
  }
}, { timestamps: true });


const CollegeModel = mongoose.model("colleges", CollegeSchema);
module.exports = CollegeModel;
=======

const CollegeModel = mongoose.model("college", CollegeSchema);
module.exports = CollegeModel;

