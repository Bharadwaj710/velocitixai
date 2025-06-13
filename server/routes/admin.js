const express = require('express');
const router = express.Router();
const { getRecentNotifications, getAllNotifications, markAsRead,getAllUsers, getAllStudents, getAllColleges, getAllHRs, getStudentFilters, getHRFilters, getAdminProfile,updateAdminProfile, deleteAdminProfile} = require('../controller/adminController');
const auth = require('../middleware/auth');
const multer = require('../middleware/multerConfig');

router.get('/users', getAllUsers);
router.get('/students', getAllStudents);
router.get('/colleges', getAllColleges);
router.get('/hrs', getAllHRs);
router.get('/students/filters', getStudentFilters);
router.get('/hrs/filters', getHRFilters);
router.get('/notifications/recent', getRecentNotifications);
router.get('/notifications/all', getAllNotifications);
router.put('/notifications/:id/read', markAsRead);

// ✅ Profile Settings Routes
router.get('/profile',auth, getAdminProfile);
router.put('/profile', auth, multer.single('image'), updateAdminProfile);
router.delete('/profile', auth, deleteAdminProfile);
module.exports = router;