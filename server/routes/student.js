const express = require("express");
const router = express.Router();
const {
  saveStudentDetails,
  getStudentDetails,
  enrollCourse,
  unenrollCourse,
  getEnrolledCourses,
  getStudentLearningProgress,
} = require("../controller/studentController");

// POST /api/students/details
router.post("/details", saveStudentDetails);
// GET /api/students/details/:userId
router.get("/details/:userId", getStudentDetails);
// GET /api/students/progress/:userId
router.get("/progress/:userId", getStudentLearningProgress);

router.post("/enroll", enrollCourse);
router.post("/unenroll", unenrollCourse);
router.get("/enrollments/:userId", getEnrolledCourses);

module.exports = router;
