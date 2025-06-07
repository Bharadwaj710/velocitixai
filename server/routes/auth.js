const { signupValidation } = require("../middleware/authValidation");
const { loginValidation } = require("../middleware/authValidation");
const { signup } = require("../controller/authController");
const { login } = require("../controller/authController");

const router = require("express").Router();

router.post("/login", loginValidation, login);
router.post("/signup", signupValidation, signup);

module.exports = router;
