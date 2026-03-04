const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");

// Import routes
const aiRoutes = require("./routes/ai.routes");
const authRoutes = require("./routes/auth.routes");
const usersRoutes = require("./routes/users.routes");
const schoolsRoutes = require("./routes/schools.routes");
const registerRoutes = require("./routes/register.routes");
const passwordRoutes = require("./routes/password.routes");
const academicTermsRoutes = require("./routes/academicTermsRoutes");
const feeStructureRoutes = require("./routes/feeStructure.routes");

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://cbc-education-system-sooty.vercel.app", "https://cbc-education-system-1.onrender.com", "https://*.vercel.app", "https://*.render.com", "https://noneaa.com", "https://www.noneaa.com"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// Compression middleware
app.use(compression());

// CORS configuration - allow multiple origins for development and production
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "http://localhost:3001",
  "https://cbc-education-system-sooty.vercel.app",
  "https://cbc-education-system-1.onrender.com",
  "https://noneaa.com",
  "https://www.noneaa.com",
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    
    // Allow all Vercel deployments - more permissive check
    // This handles production, preview, and custom deployments
    if (origin && (
      origin.includes('.vercel.app') || 
      origin.includes('vercel.app') ||
      origin.endsWith('vercel.app')
    )) {
      return callback(null, true);
    }
    
    // Also allow all Render deployments
    if (origin && (
      origin.includes('.render.com') || 
      origin.includes('render.com')
    )) {
      return callback(null, true);
    }
    
    // Allow GitHub Codespaces domains
    if (origin && (
      origin.includes('.github.dev') || 
      origin.includes('github.dev')
    )) {
      return callback(null, true);
    }
    
    // Allow noneaa.com and its subdomains (custom production domain)
    if (origin && /^https:\/\/([a-z0-9-]+\.)?noneaa\.com$/.test(origin)) {
      return callback(null, true);
    }
    
    // Log the rejected origin for debugging
    console.log('CORS rejected origin:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token", "X-Requested-With", "Accept", "Origin", "Access-Control-Request-Methods", "Access-Control-Request-Headers"],
  exposedHeaders: ["Content-Length", "Content-Type", "Authorization", "Access-Control-Allow-Origin"],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Trust proxy for accurate IP addresses (important for rate limiting)
app.set("trust proxy", 1);

// ==================== ROOT ROUTE HANDLER ====================
// Add this before your API routes
app.get("/", (req, res) => {
  res.json({
    success: true,
    name: "CBC Education System API",
    version: "1.0.0",
    description: "Enterprise-grade authentication and AI assistant API",
    status: "running",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
    endpoints: {
      root: "/",
      health: "/health",
      api_info: "/api",
      auth: "/api/auth/*",
      users: "/api/users/*",
      register: "/api/register/*",
      password: "/api/password/*",
      ai: "/api/ai/*"
    },
    documentation: "https://github.com/communityteksoft-source/cbc-education-system"
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/schools", schoolsRoutes);
app.use("/api/register", registerRoutes);
app.use("/api/password", passwordRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/v1/academic-terms", academicTermsRoutes);
app.use("/api/v1/fee-structures", feeStructureRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage()
  });
});

// API info endpoint
app.get("/api", (req, res) => {
  res.json({
    name: "CBC Education System API",
    version: "1.0.0",
    description: "Enterprise-grade authentication and AI assistant API",
    endpoints: {
      auth: "/api/auth/*",
      ai: "/api/ai/*",
      users: "/api/users/*",
      register: "/api/register/*",
      password: "/api/password/*"
    },
    documentation: "https://github.com/communityteksoft-source/cbc-education-system"
  });
});

// 404 handler - This catches all unmatched routes
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Global error:", err);
  
  // Don't leak error details in production
  if (process.env.NODE_ENV === "production") {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Internal server error"
    });
  } else {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Internal server error",
      stack: err.stack
    });
  }
});

module.exports = app;