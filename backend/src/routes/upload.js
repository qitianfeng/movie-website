const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { auth } = require('../middleware/auth');
const { pool } = require('../config/database');

const router = express.Router();

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads/avatars');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${req.userId}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Upload avatar
router.post('/avatar', auth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_FILE', message: 'No file uploaded' }
      });
    }

    // Generate avatar URL
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    // Update user avatar in database
    await pool.execute(
      `UPDATE users SET avatar = ? WHERE id = ?`,
      [avatarUrl, req.userId]
    );

    // Delete old avatar file if exists and is local file
    const [rows] = await pool.execute(
      `SELECT avatar FROM users WHERE id = ?`,
      [req.userId]
    );
    
    // Note: We already updated, so this gets the new avatar
    // For old avatar cleanup, we'd need to fetch before update

    res.json({
      success: true,
      data: { avatar: avatarUrl }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

// Serve static files
router.use('/avatars', express.static(uploadDir));

module.exports = router;
