/**
 * 🔒 SECURITY: CSRF Protection Middleware
 * Protects against Cross-Site Request Forgery attacks
 */

const { doubleCsrf } = require('csrf-csrf');

// Configure CSRF protection with simpler options
const {
  generateToken,
  validateRequest,
  doubleCsrfProtection,
} = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET || 'default-csrf-secret-change-in-production',
  cookieName: 'csrf-token', // Simplified cookie name
  cookieOptions: {
    sameSite: 'lax', // More permissive for compatibility
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  getTokenFromRequest: (req) => {
    return req.headers['x-csrf-token'] || 
           req.headers['csrf-token'] || 
           req.body._csrf;
  },
});

/**
 * Middleware to generate and send CSRF token
 */
const sendCsrfToken = (req, res, next) => {
  try {
    const token = generateToken(req, res);
    res.locals.csrfToken = token;
    next();
  } catch (error) {
    console.error('[CSRF] Error generating token:', error.message);
    console.error('[CSRF] Stack:', error.stack);
    next(error);
  }
};

/**
 * Endpoint to get CSRF token
 */
const getCsrfToken = (req, res) => {
  try {
    console.log('[CSRF] Generating token...');
    const token = generateToken(req, res);
    console.log('[CSRF] Token generated successfully');
    res.json({
      success: true,
      csrfToken: token,
    });
  } catch (error) {
    console.error('[CSRF] Error in getCsrfToken:', error.message);
    console.error('[CSRF] Stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Failed to generate CSRF token',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  doubleCsrfProtection,
  sendCsrfToken,
  getCsrfToken,
  generateToken,
};
