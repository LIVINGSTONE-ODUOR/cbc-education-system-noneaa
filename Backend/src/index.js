require("dotenv").config();
const app = require("./app");
const logger = require("./utils/logger");
const { validateEnv } = require("./config/env");

// Validate critical environment variables before starting
try {
  validateEnv();
} catch (err) {
  logger.error("Environment validation failed:", err.message);
  process.exit(1);
}

// For local/traditional server deployment (like Render)
const PORT = process.env.PORT || 3001;

// Only start the server if not in Vercel serverless environment
if (process.env.VERCEL !== "1") {
  app.listen(PORT, "0.0.0.0", () => {
    logger.boot(`CBE AI Backend running on port ${PORT}`);
    logger.boot(`Environment: ${process.env.NODE_ENV || "development"}`);
    logger.boot(`Local: http://localhost:${PORT}`);
    logger.boot(`Health check: http://localhost:${PORT}/health`);
  });
}

// For Vercel serverless export
module.exports = app;