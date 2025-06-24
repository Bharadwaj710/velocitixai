const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  updateUser,
  deleteUser,
  getUserById,
  changePassword,
  uploadProfileImage,
} = require("../controller/userController");
const multer = require("../middleware/multerConfig");

// GET all users
router.get("/", getAllUsers);
// GET user by id
router.get("/:id", getUserById);

// CHANGE PASSWORD
router.put("/change-password/:id", changePassword);
// DELETE user
router.delete("/:id", deleteUser);
// PUT: Upload profile image to Cloudinary
router.put("/upload-profile/:id", multer.single("profilePicture"), uploadProfileImage);
// PUT: Update user profile (name, email, password, etc.)
router.put("/profile/:id", multer.single("profilePicture"), updateUser);
module.exports = router;