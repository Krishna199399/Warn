const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.originalUrl} →`, err.message);

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({ success: false, error: `${field} already exists` });
  }
  // Mongoose validation
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ success: false, error: errors.join(', ') });
  }
  // JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
  // Multer errors
  if (err.name === 'MulterError') {
    return res.status(400).json({ success: false, error: err.message });
  }

  return res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
};

module.exports = errorHandler;
