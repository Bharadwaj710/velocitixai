const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// Configure Cloudinary using environment variables (must exist in server/.env)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// 📁 Profile pictures (images only)
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "profile_pictures",
    allowed_formats: ["jpg", "png", "jpeg", "pdf"],
    transformation: [{ width: 300, height: 300, crop: "limit" }],
  },
});

// 📁 Career assessment videos
const videoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "career_assessment_videos",
    resource_type: "video", // 🔥 important
    allowed_formats: ["mp4", "webm", "mp3", "wav"],
  },
});

// 📁 Interview videos (completed + terminated)
const interviewVideoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "interview_videos",
    resource_type: "video", // ✅ ensures video uploads
    allowed_formats: ["mp4", "webm", "avi", "mov", "mkv"], // add more if needed
  },
});

module.exports = {
  cloudinary,
  storage,
  videoStorage,
  interviewVideoStorage, // 🔥 new export
};
