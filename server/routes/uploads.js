// routes/uploads.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { protect } = require('../middleware/auth');
const logger = require('../utils/logger');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Multer config (memory storage - stream to Cloudinary)
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};
const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB

// Helper: Upload buffer to Cloudinary
const uploadToCloudinary = (buffer, folder, options = {}) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `turfzone/${folder}`, resource_type: 'image', ...options },
      (err, result) => err ? reject(err) : resolve(result)
    );
    stream.end(buffer);
  });
};

// @POST /uploads/turf-images (owner/admin)
router.post('/turf-images', protect, upload.array('images', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No images uploaded.' });
    }

    const uploadPromises = req.files.map(file =>
      uploadToCloudinary(file.buffer, 'turfs', {
        transformation: [{ width: 1200, height: 800, crop: 'fill', quality: 'auto' }]
      })
    );

    const results = await Promise.all(uploadPromises);
    const images = results.map(r => ({ public_id: r.public_id, url: r.secure_url }));

    logger.info(`📸 Uploaded ${images.length} turf images`);
    res.json({ success: true, message: `${images.length} image(s) uploaded.`, data: images });
  } catch (err) {
    logger.error(`Upload error: ${err.message}`);
    res.status(500).json({ success: false, message: 'Image upload failed.' });
  }
});

// @POST /uploads/avatar
router.post('/avatar', protect, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No image uploaded.' });

    const result = await uploadToCloudinary(req.file.buffer, 'avatars', {
      transformation: [{ width: 200, height: 200, crop: 'fill', gravity: 'face', quality: 'auto' }]
    });

    const User = require('../models/User');
    await User.findByIdAndUpdate(req.user.id, {
      avatar: { public_id: result.public_id, url: result.secure_url }
    });

    res.json({ success: true, message: 'Avatar updated.', data: { url: result.secure_url } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Avatar upload failed.' });
  }
});

// @DELETE /uploads/:publicId
router.delete('/:publicId', protect, async (req, res) => {
  try {
    await cloudinary.uploader.destroy(`turfzone/${req.params.publicId}`);
    res.json({ success: true, message: 'Image deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not delete image.' });
  }
});

module.exports = router;
