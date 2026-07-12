const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Create Express app
const app = express();

// Trust proxy for accurate IP detection (important for GitHub Codespaces and rate limiting)
app.set('trust proxy', true);

// ==================== MIDDLEWARE ====================
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // Allow cross-origin resource sharing
}));
app.use(compression()); // Compress responses

// Serve static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==================== CORS CONFIGURATION FOR GITHUB CODESPACES ====================

// Load origins from .env
const envOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

// Default development origins including GitHub Codespaces patterns
const defaultOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://localhost:5174',
  'https://localhost:5173',
  'https://localhost:5174',
  'https://cbc-education-system-a478.vercel.app',
  'https://cbc-education-system-1.onrender.com',
  // Additional production frontend origins
  'https://www.noneaa.com',
  'https://noneaa.com',
  // GitHub Codespaces patterns

  'https://*.app.github.dev',
  'https://*.preview.app.github.dev',
  'https://*.vercel.app',
  'https://*.render.com'
];

// Function to check if origin matches dynamic host patterns (Codespaces / Vercel / Render)
const normalizeOrigin = (origin) => {
  if (!origin) return '';
  // Trim whitespace and remove any trailing slash to prevent subtle mismatches
  return String(origin).trim().replace(/\/$/, '');
};

const isAllowedDynamicOrigin = (origin) => {
  origin = normalizeOrigin(origin);
  if (!origin) return false;
  const patterns = [
    /^https:\/\/[a-zA-Z0-9\-]+\.app\.github\.dev$/,
    /^https:\/\/[a-zA-Z0-9\-]+\.preview\.app\.github\.dev$/,
    /^https:\/\/[a-zA-Z0-9\-]+-3001\.app\.github\.dev$/,
    /^https:\/\/[a-zA-Z0-9\-]+-5173\.app\.github\.dev$/,
    /^https:\/\/[a-zA-Z0-9\-]+\.vercel\.app$/,
    /^https:\/\/[a-zA-Z0-9\-]+\.onrender\.com$/,
    // School subdomains, e.g. https://maseno.noneaa.com
    /^https:\/\/[a-zA-Z0-9\-]+\.noneaa\.com$/,
    /^https:\/\/[a-zA-Z0-9\-]+\.render\.com$/
  ];
  return patterns.some(pattern => pattern.test(origin));
};

// Merge and remove duplicates (and normalize for exact matching)
const allowedOrigins = [...new Set([...envOrigins, ...defaultOrigins].map(normalizeOrigin))];

// Log CORS configuration on startup
console.log('[CORS] Configuration loaded');
console.log('[CORS] Allowed origins:', allowedOrigins);
console.log('[CORS] Dynamic host pattern matching enabled (Codespaces / Vercel / Render)');

const isOriginAllowed = (origin) => {
  origin = normalizeOrigin(origin);
  if (!origin) return false;
  if (allowedOrigins.includes(origin)) return true;
  if (isAllowedDynamicOrigin(origin)) return true;
  return false;
};

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests without origin (Postman, mobile apps, curl, server-to-server)
    if (!origin) {
      return callback(null, true);
    }

    if (isOriginAllowed(origin)) {
      const normalized = normalizeOrigin(origin);
      console.log('[CORS] ✅ Allowed origin:', normalized);
      return callback(null, true);
    }

    const normalized = normalizeOrigin(origin);
    console.warn('[CORS] ❌ Blocked request from origin:', normalized);
    console.warn('[CORS] Allowed origins are:', allowedOrigins);

    return callback(new Error(`CORS policy: Origin ${normalized} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Cookie',
    'Set-Cookie'
  ],
  exposedHeaders: ['Set-Cookie'],
  optionsSuccessStatus: 200,
  preflightContinue: false
}));

// Handle preflight requests explicitly
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  console.log('[CORS] Handling preflight request from origin:', origin);

  // Keep logic consistent with the main cors middleware decision
  if (!origin || isOriginAllowed(origin)) {
    res.header('Access-Control-Allow-Origin', normalizeOrigin(origin) || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD');
    res.header(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cookie, Set-Cookie'
    );
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400'); // 24 hours
    return res.sendStatus(200);
  }

  console.warn('[CORS] Preflight blocked for origin:', normalizeOrigin(origin));
  return res.sendStatus(403);
});

app.use(morgan('combined')); // HTTP request logging
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==================== RATE LIMIT ====================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// ==================== REQUEST LOGGING MIDDLEWARE ====================
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - Origin: ${req.headers.origin || 'unknown'}`);
  next();
});

// ==================== ROUTES ====================

// Learners API routes
app.use('/api/v1/learners', require('./routes/learner.routes'));

// API Versioning
// NOTE: auth.routes already includes both legacy and v1 prefixes (e.g. /v1/login).
// Mounting it at '/api/v1/auth' caused the frontend to hit '/api/v1/login'
// while the backend effectively served '/api/v1/auth/v1/login' (404).
app.use('/api', require('./routes/auth.routes'));
app.use('/api/v1/classes', require('./routes/class.routes'));
app.use('/api/v1/exams', require('./routes/exam.routes'));
app.use('/api/v1/promotions', require('./routes/promotion.routes'));
app.use('/api/v1/attendance', require('./routes/attendance.routes'));
app.use('/api/v1/results', require('./routes/results.routes'));
app.use('/api/v1/assignments', require('./routes/assignment.routes'));

app.use('/api/v1/register', require('./routes/register.routes'));


// Users (includes profile endpoints)
app.use('/api/v1/users', require('./routes/users.routes'));

app.use('/api/v1/schools', require('./routes/schools.routes'));
app.use('/api/v1/password', require('./routes/password.routes'));
app.use('/api/v1/academic-terms', require('./routes/academicTermsRoutes'));
app.use('/api/v1/academic-years', require('./routes/academicYear.routes'));
app.use('/api/v1/teachers', require('./routes/teacher.routes'));
app.use('/api/v1/curriculum', require('./routes/curriculum.routes'));
app.use('/api/v1/departments', require('./routes/department.routes'));
app.use('/api/v1/fee-structure', require('./routes/feeStructure.routes'));
app.use('/api/v1/ai', require('./routes/ai.routes'));
app.use('/api/v1/ai-assistant', require('./routes/aiAssistant.routes'));
app.use('/api/v1/live-chat', require('./routes/liveChat.routes'));
app.use('/api/v1/website-owner', require('./routes/websiteOwner.routes'));

// Parents API routes
app.use('/api/v1/parents', require('./routes/parent.routes'));
app.use('/api/v1/parent-dashboard', require('./routes/parentDashboard.routes'));

// Profile (non-versioned fallback)
app.use('/api/users', require('./routes/users.routes'));

// ==================== HEALTH CHECK ====================
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    cors: 'enabled',
    allowedOrigins: allowedOrigins.length
  });
});

// ==================== DEBUG ENDPOINT (dev only) ====================
if (process.env.NODE_ENV !== 'production') {
  app.get('/debug/cors-info', (req, res) => {
    res.json({
      allowedOrigins: allowedOrigins,
      requestOrigin: req.headers.origin,
      environment: process.env.NODE_ENV,
      nodeVersion: process.version
    });
  });
}

// ==================== 404 HANDLER ====================
app.use('*', (req, res) => {
  console.log(`[404] ${req.method} ${req.originalUrl} - Not found`);
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// ==================== ERROR HANDLING MIDDLEWARE ====================
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack);
  
  // Handle CORS errors specifically
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      error: 'CORS policy violation',
      message: err.message,
      timestamp: new Date().toISOString()
    });
  }
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    timestamp: new Date().toISOString()
  });
});

module.exports = app;
