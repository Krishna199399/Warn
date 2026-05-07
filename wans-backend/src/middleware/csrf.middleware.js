/**
 * 🔒 SECURITY: CSRF Protection Middleware
 * Protects against Cross-Site Request Forgery attacks
 */

const { doubleCsrf } = require('csrf-csrf');

// Configure CSRF protection
const doubleCsrfOptions = {
  getSecret: () => process.env.CSRF_SECRET || 'default-csrf-secret-change-in-production',
  cookieName: process.env.NODE_ENV === 'production' ? '__Host-csrf' : 'csrf-token',
  cookieOptions: {
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true,
  },
  size: 64, // Token size
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'], // Don't require CSRF for safe methods
  getTokenFromRequest: (req) => {
    // Check multiple sources for CSRF token
    return req.headers['x-csrf-token'] || 
           req.headers['csrf-token'] || 
           req.body._csrf;
  },
};

const {
  generateToken, // Generates a CSRF token
  doubleCsrfProtection, // Middleware to validate CSRF tokens
} = doubleCsrf(doubleCsrfOptions);

/**
 * Middleware to generate and send CSRF token
 */
const sendCsrfToken = (req, res, next) => {
  try {
    const token = generateToken(req, res);
    res.locals.csrfToken = token;
    next();
  } catch (error) {
    console.error('[CSRF] Error generating token:', error);
    next(error);
  }
};

/**
 * Endpoint to get CSRF token
 */
const getCsrfToken = (req, res) => {
  try {
    const token = generateToken(req, res);
    res.json({
      success: true,
      csrfToken: token,
    });
  } catch (error) {
    console.error('[CSRF] Error in getCsrfToken:', error);
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
