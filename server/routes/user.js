const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  updateUser,
  deleteUser,
} = require("../controller/userController");

// GET all users
router.get("/", getAllUsers);
// UPDATE user
router.put("/:id", updateUser);
// DELETE user
router.delete("/:id", deleteUser);

module.exports = router;
