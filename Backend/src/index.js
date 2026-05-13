require("dotenv").config();
const app = require("./app");

// For local/traditional server deployment (like Render)
const PORT = process.env.PORT || 3001;

// Only start the server if not in Vercel serverless environment
if (process.env.VERCEL !== "1") {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 CBE AI Backend running on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`🔗 Local: http://localhost:${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log(`🔗 CORS Allowed Origins: Configured for GitHub Codespaces`);
  });
} else {
  console.log("📦 Running in Vercel serverless mode");
}

// For Vercel serverless export (this must be at the end)
module.exports = app;