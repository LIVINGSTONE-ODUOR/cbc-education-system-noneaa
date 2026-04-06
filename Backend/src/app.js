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

// ==================== MIDDLEWARE ====================
app.use(helmet()); // Security headers
app.use(compression()); // Compress responses
// CORS configuration - allow frontend and Supabase storage
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:5173', // Vite dev server
  // Supabase storage is accessed from browser directly, so we don't need to whitelist it here
  // But we allow requests from our app
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked request from origin:`, origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('combined')); // HTTP request logging
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// ==================== ROUTES ====================

// Learners API routes
app.use('/api/v1/learners', require('./routes/learner.routes'));

// API Versioning
app.use('/api/v1/auth', require('./routes/auth.routes'));
app.use('/api/v1/classes', require('./routes/class.routes'));

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/v1/register', require('./routes/register.routes'));
app.use('/api/v1/users', require('./routes/users.routes'));
app.use('/api/v1/schools', require('./routes/schools.routes'));
app.use('/api/v1/password', require('./routes/password.routes'));
app.use('/api/v1/academic-terms', require('./routes/academicTermsRoutes'));
app.use('/api/v1/academic-years', require('./routes/academicYear.routes'));
app.use('/api/v1/teachers', require('./routes/teacher.routes'));
app.use('/api/v1/curriculum', require('./routes/curriculum.routes'));
app.use('/api/v1/fee-structure', require('./routes/feeStructure.routes'));
app.use('/api/v1/ai', require('./routes/ai.routes'));
app.use('/api/v1/ai-assistant', require('./routes/aiAssistant.routes'));

// Parents API routes  
app.use('/api/v1/parents', require('./routes/parent.routes'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

module.exports = app;

