// server/routes/hr.js
const express = require('express');
const router = express.Router();

// Import HR-related handlers
const {
  getAllStudents,
  getHRDetailsByUser,
  sendInvite
} = require('../controller/hrController');

// Import invitation-related handlers
const {
  getInvitedStudents,
  deleteInvitedStudent
} = require('../controller/hireController');

// Routes
router.get('/students', getAllStudents);
router.get('/:userId/details', getHRDetailsByUser);
router.post('/send-invite', sendInvite);
router.get('/:hrId/invited-students', getInvitedStudents);
router.delete('/invited-students/:invitationId', deleteInvitedStudent);

module.exports = router;
