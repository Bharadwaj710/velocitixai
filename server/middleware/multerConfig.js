const multer = require('multer');
const { storage } = require('../utlis/cloudinary'); // ✅ Using cloudinary instead of local

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Only image files are allowed'), false);
};

module.exports = multer({ storage, fileFilter });
