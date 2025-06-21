const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// ✅ Load environment variables safely
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'profile_pictures',
    allowed_formats: ['jpg', 'png', 'jpeg','pdf'],
    transformation: [{ width: 300, height: 300, crop: 'limit' }],
  },
});
const videoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'career_assessment_videos',
    resource_type: 'video', // 🔥 critical
    allowed_formats: ['mp4', 'webm', 'mp3', 'wav'],
  },
});

module.exports = {
  cloudinary,
  storage,
    videoStorage
};
