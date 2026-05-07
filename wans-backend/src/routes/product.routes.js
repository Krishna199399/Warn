const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const { protect, optionalAuth } = require('../middleware/auth.middleware');
const { adminOnly } = require('../middleware/role.middleware');
const validate = require('../middleware/validate.middleware');
const { createProductSchema, updateProductSchema } = require('../schemas/product.schema');
const ctrl          = require('../controllers/product.controller');

// ─── Upload directory ─────────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, '../../uploads/products');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// ─── Multer config ────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename:    (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `product-${unique}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const ok = /\.(jpeg|jpg|png|gif|webp)$/.test(ext) && file.mimetype.startsWith('image/');
  ok ? cb(null, true) : cb(new Error('Only image files are allowed'));
};

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter });

// ─── Express 5 + Multer 2 compatible wrapper ──────────────────────────────────
// Express 5 changed how async middleware errors are handled; multer 2 needs
// this promise wrapper so errors propagate to the error handler correctly.
function uploadMiddleware(req, res, next) {
  upload.single('image')(req, res, (err) => {
    if (err) return next(err);
    next();
  });
}

// ─── Routes ───────────────────────────────────────────────────────────────────
// GET routes use optionalAuth so admin callers get full data; others get public fields only
router.get   ('/',     optionalAuth, ctrl.getAllProducts);
router.get   ('/:id',  optionalAuth, ctrl.getProduct);
router.get   ('/:id/stock-check', protect, adminOnly, ctrl.checkProductStock);
// Write routes require auth + admin role
// 🔒 SECURITY: Validation applied to product creation/updates
router.post  ('/',     protect, adminOnly, uploadMiddleware, validate(createProductSchema), ctrl.createProduct);
router.put   ('/:id',  protect, adminOnly, uploadMiddleware, validate(updateProductSchema), ctrl.updateProduct);
router.delete('/:id',  protect, adminOnly, ctrl.deleteProduct);

module.exports = router;
