const express = require('express');
const router = express.Router();
const { getAllUsers, getAllStudents, getAllColleges,getAllHRs } = require('../controller/adminController');

router.get('/users', getAllUsers);
router.get('/students', getAllStudents);
router.get('/colleges', getAllColleges);
router.get('/hrs', getAllHRs);

module.exports = router;