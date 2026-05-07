const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const morgan       = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit    = require('express-rate-limit');
const path         = require('path');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// 🔒 SECURITY: HTTPS enforcement in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      return res.redirect(`https://${req.header('host')}${req.url}`);
    }
    next();
  });
}

// ─── Security ─────────────────────────────────────────────────────────────────
// 🔒 SECURITY: Enhanced Helmet configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Consider removing unsafe-inline in production
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.FRONTEND_URL || 'http://localhost:5173'],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  dnsPrefetchControl: true,
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: { permittedPolicies: "none" },
  referrerPolicy: { policy: 'no-referrer' },
  xssFilter: true,
}));

// 🔒 SECURITY: Endpoint-specific rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per 15 minutes
  message: { success: false, error: 'Too many login attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 payment requests per 15 minutes
  message: { success: false, error: 'Too many payment requests. Please try again later.' },
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200,
  message: { success: false, error: 'Too many requests' },
});
app.use('/api', generalLimiter);

// ─── CORS (VPS self-hosted — allow frontend origin) ───────────────────────────
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim());   // guard against whitespace in env value

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman, or same-origin)
    if (!origin) return callback(null, true);
    
    // In development, allow localhost on any port
    if (process.env.NODE_ENV === 'development' && origin.includes('localhost')) {
      return callback(null, true);
    }
    
    // Check against allowed origins
    if (allowedOrigins.includes(origin)) return callback(null, true);
    
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-CSRF-Token'],
  exposedHeaders: ['Set-Cookie'],
};

app.use(cors(corsOptions));

// ─── Body + Cookie parsing ────────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Static files (uploads) ───────────────────────────────────────────────────
// Override Helmet's default Cross-Origin-Resource-Policy: same-origin so the
// frontend (port 5173) can load product images served from this server (port 5000).
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, '../uploads')));

// ─── Logging ──────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

// ─── CSRF Protection ──────────────────────────────────────────────────────────
// 🔒 SECURITY: CSRF token endpoint (must be before CSRF protection middleware)
const { getCsrfToken, doubleCsrfProtection } = require('./middleware/csrf.middleware');
app.get('/api/csrf-token', getCsrfToken);

// 🔒 SECURITY: Apply CSRF protection to state-changing routes
// Applied before route definitions to protect all POST/PUT/PATCH/DELETE requests
const csrfProtectedPaths = [
  '/api/orders',
  '/api/products',
  '/api/inventory',
  '/api/payments',
  '/api/manual-payments',
  '/api/users',
  '/api/benefit-claims',
  '/api/payouts'
];

csrfProtectedPaths.forEach(path => {
  app.use(path, doubleCsrfProtection);
});

// ─── Routes ───────────────────────────────────────────────────────────────────
// 🔒 SECURITY: Apply stricter rate limiting to auth endpoints
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/refresh', authLimiter);

// 🔒 SECURITY: Apply stricter rate limiting to payment endpoints
app.use('/api/payments', paymentLimiter);
app.use('/api/manual-payments', paymentLimiter);

app.use('/api/auth',        require('./routes/auth.routes'));
app.use('/api/users',       require('./routes/user.routes'));
app.use('/api/orders',      require('./routes/order.routes'));
app.use('/api/visits',      require('./routes/visit.routes'));
app.use('/api/commissions', require('./routes/commission.routes'));
app.use('/api/analytics',   require('./routes/analytics.routes'));
app.use('/api/products',    require('./routes/product.routes'));
app.use('/api/categories',  require('./routes/category.routes'));
app.use('/api/farmers',     require('./routes/farmer.routes'));
app.use('/api/tasks',       require('./routes/task.routes'));
app.use('/api/inventory',     require('./routes/inventory.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/config',        require('./routes/config.routes'));  // Income distribution config
app.use('/api/salary',         require('./routes/salary.routes')); // Salary targets & rewards
app.use('/api/benefit-claims', require('./routes/benefitClaim.routes')); // Benefit claim system
app.use('/api/payouts',        require('./routes/payout.routes')); // Payout system
app.use('/api/payments',        require('./routes/payment.routes'));         // Razorpay gateway (legacy)
app.use('/api/manual-payments', require('./routes/manualPayment.routes'));  // Manual UPI + Cash system

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ success: true, message: 'WANS API is running 🌱' }));

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.status(404).json({ success: false, error: `Route ${req.originalUrl} not found` });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
