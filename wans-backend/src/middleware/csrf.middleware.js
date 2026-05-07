/**
 * 🔒 SECURITY: CSRF Protection Middleware
 * Protects against Cross-Site Request Forgery attacks
 */

const { doubleCsrf } = require('csrf-csrf');

// Configure CSRF protection
const {
  generateToken, // Generates a CSRF token
  doubleCsrfProtection, // Middleware to validate CSRF tokens
} = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET || 'default-csrf-secret-change-in-production',
  cookieName: '__Host-csrf-token',
  cookieOptions: {
    sameSite: 'strict',
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
});

/**
 * Middleware to generate and send CSRF token
 */
const sendCsrfToken = (req, res, next) => {
  const token = generateToken(req, res);
  res.locals.csrfToken = token;
  next();
};

/**
 * Endpoint to get CSRF token
 */
const getCsrfToken = (req, res) => {
  const token = generateToken(req, res);
  res.json({
    success: true,
    csrfToken: token,
  });
};

module.exports = {
  doubleCsrfProtection,
  sendCsrfToken,
  getCsrfToken,
  generateToken,
};
