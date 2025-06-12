const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const HRSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  company: {
    type: String,
    required: true
  },
  designation: {
    type: String
  },
  experience: {
    type: Number // years
  },
  phoneNumber:{type: Number},
  address: String
}, {
  timestamps: true
});

module.exports = mongoose.model("hrs", HRSchema);