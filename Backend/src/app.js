const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');

const logger = require('./utils/logger');
const requestLogger = require('./middleware/requestLogger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Create Express app
const app = express();

const isProduction = (process.env.NODE_ENV || 'development').toLowerCase() === 'production';

// ==================== TRUST PROXY ====================
// Production: trust the first proxy (reverse proxy, load balancer, Vercel, Render)
// Development: no proxy — trust proxy is off to avoid ERR_ERL_PERMISSIVE_TRUST_PROXY
app.set('trust proxy', isProduction ? 1 : false);

// ==================== SECURITY MIDDLEWARE ====================
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      fontSrc: ["'self'", 'https:', 'data:'],
      connectSrc: ["'self'", 'https:'],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
      baseUri: ["'self'"],
    },
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
  hidePoweredBy: true,
  ieNoOpen: true,
}));

app.use(compression());

// Serve static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==================== CORS CONFIGURATION ====================
const envOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

const defaultOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://localhost:5174',
  'https://localhost:5173',
  'https://localhost:5174',
  'https://cbc-education-system-a478.vercel.app',
  'https://cbc-education-system-1.onrender.com',
  'https://www.noneaa.com',
  'https://noneaa.com',
];

const normalizeOrigin = (origin) => {
  if (!origin) return '';
  return String(origin).trim().replace(/\/$/, '');
};

const isAllowedDynamicOrigin = (origin) => {
  origin = normalizeOrigin(origin);
  if (!origin) return false;
  const patterns = [
    /^https:\/\/[a-zA-Z0-9-]+\.app\.github\.dev$/,
    /^https:\/\/[a-zA-Z0-9-]+\.preview\.app\.github\.dev$/,
    /^https:\/\/[a-zA-Z0-9-]+-3001\.app\.github\.dev$/,
    /^https:\/\/[a-zA-Z0-9-]+-5173\.app\.github\.dev$/,
    /^https:\/\/[a-zA-Z0-9-]+\.vercel\.app$/,
    /^https:\/\/[a-zA-Z0-9-]+\.onrender\.com$/,
    /^https:\/\/[a-zA-Z0-9-]+\.noneaa\.com$/,
    /^https:\/\/[a-zA-Z0-9-]+\.render\.com$/,
  ];
  return patterns.some(pattern => pattern.test(origin));
};

const allowedOrigins = [...new Set([...envOrigins, ...defaultOrigins].map(normalizeOrigin))];

const isOriginAllowed = (origin) => {
  origin = normalizeOrigin(origin);
  if (!origin) return false;
  if (allowedOrigins.includes(origin)) return true;
  if (isAllowedDynamicOrigin(origin)) return true;
  return false;
};

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    if (isProduction) {
      logger.warn('CORS blocked origin:', normalizeOrigin(origin));
    }
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type', 'Authorization', 'X-Requested-With',
    'Accept', 'Origin', 'Cookie', 'Set-Cookie',
  ],
  exposedHeaders: ['Set-Cookie'],
  optionsSuccessStatus: 200,
  preflightContinue: false,
}));

// Handle preflight requests explicitly
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  if (!origin || isOriginAllowed(origin)) {
    res.header('Access-Control-Allow-Origin', normalizeOrigin(origin) || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cookie, Set-Cookie');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400');
    return res.sendStatus(200);
  }
  return res.sendStatus(403);
});

// ==================== REQUEST PARSING ====================
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==================== REQUEST LOGGING ====================
app.use(requestLogger);

// ==================== RATE LIMIT ====================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path.startsWith('/v1/live-chat'),
});

app.use('/api/', limiter);

// ==================== ROUTES ====================
app.use('/api/v1/learners', require('./routes/learner.routes'));
app.use('/api', require('./routes/auth.routes'));
app.use('/api/v1/classes', require('./routes/class.routes'));
app.use('/api/v1/exams', require('./routes/exam.routes'));
app.use('/api/v1/promotions', require('./routes/promotion.routes'));
app.use('/api/v1/attendance', require('./routes/attendance.routes'));
app.use('/api/v1/results', require('./routes/results.routes'));
app.use('/api/v1/assignments', require('./routes/assignment.routes'));
app.use('/api/v1/study-groups', require('./routes/studyGroup.routes'));
app.use('/api/v1/lost-found', require('./routes/lostFound.routes'));
app.use('/api/v1/campus-locations', require('./routes/campusLocation.routes'));
app.use('/api/v1/portfolio', require('./routes/portfolio.routes'));
app.use('/api/v1/register', require('./routes/register.routes'));
app.use('/api/v1/users', require('./routes/users.routes'));
app.use('/api/v1/schools', require('./routes/schools.routes'));
app.use('/api/v1/password', require('./routes/password.routes'));
app.use('/api/v1/academic-terms', require('./routes/academicTermsRoutes'));
app.use('/api/v1/academic-years', require('./routes/academicYear.routes'));
app.use('/api/v1/teachers', require('./routes/teacher.routes'));
app.use('/api/v1/curriculum', require('./routes/curriculum.routes'));
app.use('/api/v1/departments', require('./routes/department.routes'));
app.use('/api/v1/fee-structures', require('./routes/feeStructure.routes'));
app.use('/api/v1/ai', require('./routes/ai.routes'));
app.use('/api/v1/ai-assistant', require('./routes/aiAssistant.routes'));
app.use('/api/v1/live-chat', require('./routes/liveChat.routes'));
app.use('/api/v1/grading', require('./routes/grading.routes'));
app.use('/api/v1/performance', require('./routes/performance.routes'));


app.use('/api/v1/website-owner', require('./routes/websiteOwner.routes'));
app.use('/api/v1/parents', require('./routes/parent.routes'));
app.use('/api/v1/parent-dashboard', require('./routes/parentDashboard.routes'));
app.use('/api/users', require('./routes/users.routes'));

// ==================== HEALTH CHECK ====================
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: isProduction ? 'production' : 'development',
  });
});

// ==================== 404 HANDLER ====================
app.use('*', notFoundHandler);

// ==================== ERROR HANDLING MIDDLEWARE ====================
app.use(errorHandler);

module.exports = app;
