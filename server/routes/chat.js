const express = require("express");
const router = express.Router();
const chatController = require("../controller/chatController");

router.post("/message", chatController.handleMessage);

module.exports = router;
