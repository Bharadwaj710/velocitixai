const mongoose = require('mongoose');

const InvitationSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  hr: { type: mongoose.Schema.Types.ObjectId, ref: 'HR', required: true },
  invitedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Invitation', InvitationSchema);
