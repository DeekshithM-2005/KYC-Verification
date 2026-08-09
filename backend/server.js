const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// ──────────────────────────────────────────────
//  Security Middleware
// ──────────────────────────────────────────────

// Helmet — HTTP security headers
app.use(helmet());

// CORS — allow frontend origin
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Rate limiter — general API
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                  // 100 requests per window
  message: { error: "Too many requests, please try again later." },
});
app.use("/api/", generalLimiter);

// ──────────────────────────────────────────────
//  Body Parsing
// ──────────────────────────────────────────────

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Connect DB (only if not in test environment)
if (process.env.NODE_ENV !== "test") {
  connectDB();
}

// Global Logging Middleware
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== "test") {
    console.log(`${req.method} ${req.url}`);
  }
  next();
});

// ──────────────────────────────────────────────
//  Routes
// ──────────────────────────────────────────────

// Route modules (will be added in Day 2–5)
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/kyc", require("./routes/kycRoutes"));
// app.use("/api/access", require("./routes/accessRoutes"));
// app.use("/api/notifications", require("./routes/notificationRoutes"));

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date() });
});

// ──────────────────────────────────────────────
//  Error Handling
// ──────────────────────────────────────────────

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

// ──────────────────────────────────────────────
//  Start Server
// ──────────────────────────────────────────────

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  if (process.env.NODE_ENV !== "test") {
    // Connect to MongoDB
    await connectDB();

    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on http://localhost:${PORT}`);
      console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
    });
  }
};

startServer();

module.exports = app;
