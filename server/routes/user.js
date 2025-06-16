const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  updateUser,
  deleteUser,
  getUserById,
  changePassword,
} = require("../controller/userController");
const multer = require("../middleware/multerConfig");

// GET all users
router.get("/", getAllUsers);
// GET user by id
router.get("/:id", getUserById);
// UPDATE user (with multer for image upload)
router.put("/:id", multer.single("profilePicture"), updateUser);
// CHANGE PASSWORD
router.put("/change-password/:id", changePassword);
// DELETE user
router.delete("/:id", deleteUser);

module.exports = router;
