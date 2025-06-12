const express = require("express");
const router = express.Router();
const { getStudentsByCollege } = require("../controllers/collegeController");

router.get("/students/:slug", getStudentsByCollege);

module.exports = router;
