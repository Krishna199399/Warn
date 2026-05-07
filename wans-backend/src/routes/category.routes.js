const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ctrl = require('../controllers/category.controller');
const { protect } = require('../middleware/auth.middleware');

// ─── Upload directory ─────────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, '../../uploads/categories');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// ─── Multer config ────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `category-${unique}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const ok = /\.(jpeg|jpg|png|gif|webp)$/.test(ext) && file.mimetype.startsWith('image/');
  ok ? cb(null, true) : cb(new Error('Only image files are allowed'));
};

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter });

// ─── Express 5 + Multer 2 compatible wrapper ──────────────────────────────────
function uploadMiddleware(req, res, next) {
  upload.single('image')(req, res, (err) => {
    if (err) return next(err);
    next();
  });
}

// Public routes
router.get('/', ctrl.getCategories);
router.get('/:id', ctrl.getCategory);

// Admin routes with image upload
router.post('/', protect, uploadMiddleware, ctrl.createCategory);
router.put('/:id', protect, uploadMiddleware, ctrl.updateCategory);
router.delete('/:id', protect, ctrl.deleteCategory);

module.exports = router;
