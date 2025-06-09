const { signupValidation } = require("../middleware/authValidation");
const { loginValidation } = require("../middleware/authValidation");
const {
  signup,
  login,
  forgotPassword,
  resetPassword,
} = require("../controller/authController");
const { googleLogin } = require("../controller/authController");
const express = require("express");

const router = require("express").Router();

router.post("/login", loginValidation, login);
router.post("/signup", signupValidation, signup);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.post("/google", googleLogin);

module.exports = router;
