// ============================================================
// TURFZONE BACKEND - server.js
// Production-Grade Node.js + Express + MongoDB
// ============================================================

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Internal imports
const logger = require('./utils/logger');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

// Route imports
const authRoutes       = require('./routes/auth');
const userRoutes       = require('./routes/users');
const turfRoutes       = require('./routes/turfs');
const bookingRoutes    = require('./routes/bookings');
const paymentRoutes    = require('./routes/payments');
const reviewRoutes     = require('./routes/reviews');
const locationRoutes   = require('./routes/locations');
const sportRoutes      = require('./routes/sports');
const notificationRoutes = require('./routes/notifications');
const adminRoutes      = require('./routes/admin');
const uploadRoutes     = require('./routes/uploads');

// ── App Init ────────────────────────────────────────────────
const app = express();

// ── Database Connection ────────────────────────────────────
connectDB();

// ── Security Middleware ────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Stricter limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many auth attempts, please try again after 15 minutes.' }
});
app.use('/api/v1/auth/', authLimiter);

// ── CORS ───────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL_PROD,
  'https://turf-zone-lovat.vercel.app',
  'http://localhost:5173',
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    logger.warn(`CORS blocked: ${origin}`);
    return callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // ← Preflight fix
// ── Body Parsing ───────────────────────────────────────────
// Webhook route ko raw body chahiye — express.json() se pehle handle karo
app.use((req, res, next) => {
  const webhookPath = `${'/api/' + (process.env.API_VERSION || 'v1')}/bookings/webhook`;
  if (req.originalUrl === webhookPath) {
    express.raw({ type: 'application/json' })(req, res, next);
  } else {
    express.json({ limit: '10mb' })(req, res, next);
  }
});
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// ── Data Sanitization ─────────────────────────────────────
app.use(mongoSanitize());    // Prevent NoSQL injection
// app.use(xss());            // Prevent XSS (install xss-clean separately)
app.use(hpp({               // Prevent HTTP parameter pollution
  whitelist: ['sport', 'city', 'price', 'rating', 'sort', 'page', 'limit']
}));

// ── Compression ────────────────────────────────────────────
app.use(compression());

// ── Logging ────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: { write: (msg) => logger.info(msg.trim()) }
  }));
}

// ── Static Files ───────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Health Check ───────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'TurfZone API is running 🟢',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: require('./package.json').version
  });
});

// ── API Routes ─────────────────────────────────────────────
const API = `/api/${process.env.API_VERSION || 'v1'}`;

app.use(`${API}/auth`,          authRoutes);
app.use(`${API}/users`,         userRoutes);
app.use(`${API}/turfs`,         turfRoutes);
app.use(`${API}/bookings`,      bookingRoutes);
app.use(`${API}/payments`,      paymentRoutes);
app.use(`${API}/reviews`,       reviewRoutes);
app.use(`${API}/locations`,     locationRoutes);
app.use(`${API}/sports`,        sportRoutes);
app.use(`${API}/notifications`, notificationRoutes);
app.use(`${API}/admin`,         adminRoutes);
app.use(`${API}/uploads`,       uploadRoutes);

// ── Error Handling ─────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start Server ───────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  logger.info(`🚀 TurfZone Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  logger.info(`📡 API Base: http://localhost:${PORT}${API}`);
});

// ── Graceful Shutdown ──────────────────────────────────────
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => {
    logger.error('Server closed due to unhandled rejection');
    process.exit(1);
  });
});

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    mongoose.connection.close(false, () => {
      logger.info('MongoDB connection closed.');
      process.exit(0);
    });
  });
});

module.exports = app;
