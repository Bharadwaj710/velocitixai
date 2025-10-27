const express = require("express");
const router = express.Router();
const multer = require("multer");
const auth = require("../middleware/auth");
const controller = require("../controller/aiInterviewController");

// Use memory storage for interview video uploads so controller can upload buffer to Cloudinary
const memoryUpload = multer({ storage: multer.memoryStorage() });

// Keep previous lightweight upload for frames (still memory)
const upload = multer();

// 🎯 Interview routes
router.post("/start-interview", auth, controller.startInterview);
router.post("/next-question", auth, controller.nextQuestion);
router.post("/save-answer", auth, controller.saveAnswer);

router.post("/check-frame", auth, upload.single("frame"), controller.checkCheating);

// For terminate & complete use memoryUpload.single('video')
router.post("/terminate", auth, memoryUpload.single("video"), controller.terminateInterview);
router.post("/complete-interview", auth, memoryUpload.single("video"), controller.completeInterview);

// Reports
router.get("/report/:sessionId", auth, controller.getReport);
router.get("/latest-session/:studentId", auth, controller.getLatestSession);
router.get("/session/:studentId/:courseId", auth, controller.getSessionByCourse);


module.exports = router;