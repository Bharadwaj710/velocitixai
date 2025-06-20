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
    resource_type: 'raw',
    allowed_formats: ['pdf'],
  },
});

const upload = multer({ storage });

router.post('/pdf', upload.single('pdf'), async (req, res) => {
  if (!req.file?.path || !req.file?.originalname) {
    return res.status(400).json({ message: 'Upload failed' });
  }

  const originalName = req.file.originalname.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.]/g, '');
  const previewUrl = req.file.path.replace('/upload/', '/upload/fl_attachment:') + `/${originalName}`;
  const rawUrl = req.file.path.replace('/upload/', '/upload/');

  res.status(200).json({
    url: rawUrl,          // for preview
   // downloadUrl: previewUrl,  // optional: for forced download if needed
    name: req.file.originalname
  });
});

module.exports = router;
