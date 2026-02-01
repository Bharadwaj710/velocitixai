const mongoose = require('mongoose');
require('./Student'); // Ensure Student model is registered before schema definition

const InvitationSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  hr: { type: mongoose.Schema.Types.ObjectId, ref: 'HR', required: true },
  invitedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Invitation', InvitationSchema);
