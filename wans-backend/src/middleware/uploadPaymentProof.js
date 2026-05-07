const multer = require('multer');
const path   = require('path');
const fs     = require('fs');
const crypto = require('crypto');

// ─── Payment proof screenshot uploads ─────────────────────────────────────────
const paymentProofsDir = path.join(__dirname, '../../uploads/payment-proofs');
if (!fs.existsSync(paymentProofsDir)) fs.mkdirSync(paymentProofsDir, { recursive: true });

const paymentProofStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, paymentProofsDir),
  filename: (_req, file, cb) => {
    // 🔒 SECURITY: Use cryptographically random filename to prevent path traversal
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    
    if (!allowedExts.includes(ext)) {
      return cb(new Error('Invalid file extension'));
    }
    
    // Generate cryptographically secure random filename
    const randomName = crypto.randomBytes(16).toString('hex');
    const sanitizedFilename = `proof-${randomName}${ext}`;
    cb(null, sanitizedFilename);
  },
});

const imageFilter = (_req, file, cb) => {
  // 🔒 SECURITY: Strict MIME type validation
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  const allowedExts = /jpeg|jpg|png|webp|gif/;
  
  const ext  = allowedExts.test(path.extname(file.originalname).toLowerCase());
  const mime = allowedMimes.includes(file.mimetype);
  
  if (ext && mime) return cb(null, true);
  cb(new Error('Only image files (JPEG, PNG, WebP, GIF) are allowed for payment screenshots'));
};

const uploadPaymentProof = multer({
  storage: paymentProofStorage,
  fileFilter: imageFilter,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5 MB
    files: 1 // Only 1 file per request
  },
}).single('screenshot');

// Express-5 compatible wrapper — converts multer callback into a promise
const uploadPaymentProofMiddleware = (req, res, next) => {
  uploadPaymentProof(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, error: err.message });
    }
    if (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
    
    // 🔒 SECURITY: Validate image dimensions after upload
    if (req.file) {
      try {
        const sharp = require('sharp');
        const metadata = await sharp(req.file.path).metadata();
        
        // 🔒 SECURITY: Reject images with excessive dimensions (DoS prevention)
        const MAX_WIDTH = 4000;
        const MAX_HEIGHT = 4000;
        
        if (metadata.width > MAX_WIDTH || metadata.height > MAX_HEIGHT) {
          // Delete the uploaded file
          fs.unlinkSync(req.file.path);
          return res.status(400).json({ 
            success: false, 
            error: `Image dimensions too large. Maximum ${MAX_WIDTH}x${MAX_HEIGHT} pixels allowed.` 
          });
        }
        
        // 🔒 SECURITY: Verify it's actually an image (not a disguised file)
        if (!metadata.format || !['jpeg', 'png', 'webp', 'gif'].includes(metadata.format)) {
          fs.unlinkSync(req.file.path);
          return res.status(400).json({ 
            success: false, 
            error: 'Invalid image format detected' 
          });
        }
        
      } catch (sharpError) {
        // If sharp fails, the file is likely corrupted or not an image
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid or corrupted image file' 
        });
      }
    }
    
    next();
  });
};

module.exports = { uploadPaymentProofMiddleware };
