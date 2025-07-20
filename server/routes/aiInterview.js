const express = require("express");
const router = express.Router();
const multer = require("multer");
const auth = require("../middleware/auth");
const controller = require("../controller/aiInterviewController");

const upload = multer();

router.post("/start-interview", auth, controller.startInterview);
router.post("/next-question", auth, controller.nextQuestion);
router.post("/check-frame", upload.single("frame"), controller.checkCheating);
router.post("/terminate", auth, controller.terminateInterview);
router.post(
  "/complete-interview",
  auth,
  upload.single("video"),
  controller.completeInterview
);

module.exports = router;
