const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const morgan       = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit    = require('express-rate-limit');
const path         = require('path');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200,
  message: { success: false, error: 'Too many requests' },
});
app.use('/api', limiter);

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
  allowedHeaders: ['Content-Type','Authorization'],
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

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',        require('./routes/auth.routes'));
app.use('/api/users',       require('./routes/user.routes'));
app.use('/api/orders',      require('./routes/order.routes'));
app.use('/api/commissions', require('./routes/commission.routes'));
app.use('/api/promotions',  require('./routes/promotion.routes'));
app.use('/api/analytics',   require('./routes/analytics.routes'));
app.use('/api/products',    require('./routes/product.routes'));
app.use('/api/farmers',     require('./routes/farmer.routes'));
app.use('/api/tasks',       require('./routes/task.routes'));
app.use('/api/inventory',     require('./routes/inventory.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/config',        require('./routes/config.routes'));  // NEW: Income distribution config

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ success: true, message: 'WANS API is running 🌱' }));

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.status(404).json({ success: false, error: `Route ${req.originalUrl} not found` });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
