const express = require("express");
const router = express.Router();
const {
  saveStudentDetails,
  getStudentDetails,
  getStudentLearningProgress,
} = require("../controller/studentController");

// POST /api/students/details
router.post("/details", saveStudentDetails);
// GET /api/students/details/:userId
router.get("/details/:userId", getStudentDetails);
// GET /api/students/progress/:userId
router.get("/progress/:userId", getStudentLearningProgress);

module.exports = router;
