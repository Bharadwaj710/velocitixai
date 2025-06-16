const express = require("express");
const router = express.Router();
const { saveStudentDetails, getStudentDetails } = require("../controller/studentController");

// POST /api/students/details
router.post("/details", saveStudentDetails);
// GET /api/students/details/:userId
router.get("/details/:userId", getStudentDetails);

module.exports = router;
