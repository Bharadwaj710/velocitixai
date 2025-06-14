const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CollegeSchema = new Schema({

  user: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },

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
}, { timestamps: true });


const CollegeModel = mongoose.model("colleges", CollegeSchema);
module.exports = CollegeModel;


