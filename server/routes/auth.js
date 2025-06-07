const { signupValidation } = require("../middleware/authValidation");
const { loginValidation } = require("../middleware/authValidation");
const {
  signup,
  login,
  forgotPassword,
  resetPassword,
} = require("../controller/authController");


const router = require("express").Router();

router.post("/login", loginValidation, login);
router.post("/signup", signupValidation, signup);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

module.exports = router;
