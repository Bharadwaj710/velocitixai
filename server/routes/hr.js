// server/routes/hr.js
const express = require('express');
const router = express.Router();
const { getAllStudents, getHRDetailsByUser } = require('../controller/hrController');
const { sendHireInvite, getInvitedStudents, deleteInvitedStudent } = require('../controller/hireController');

// GET all students
router.get('/students', getAllStudents);
router.get('/:userId/details', getHRDetailsByUser);
// POST: send hire invitation
router.post('/send-invite', sendHireInvite);
router.get('/:hrId/invited-students', getInvitedStudents);
router.delete('/invited-students/:invitationId', deleteInvitedStudent);

module.exports = router;
