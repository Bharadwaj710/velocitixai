// routes/upload.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { cloudinary } = require('../utlis/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'velocitix_resources',
    resource_type: 'auto', // auto is correct for mixed types like pdfs
    allowed_formats: ['pdf'],
    access_mode: 'public',
  },
});

const upload = multer({ storage });

router.post('/pdf', upload.single('pdf'), async (req, res) => {
  if (!req.file?.path || !req.file?.originalname) {
    return res.status(400).json({ message: 'Upload failed' });
  }
  const rawUrl = req.file.path.replace('/upload/', '/upload/fl_attachment:false/');


  // ✅ Use secure_url instead of path
  res.status(200).json({
    url: rawUrl, // fallback in case secure_url is not populated
    name: req.file.originalname,
  });
});

module.exports = router;
