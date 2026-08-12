const express = require("express");
const { registerUser, loginUser, logoutUser } = require("../controllers/authController");
const { body, validationResult } = require("express-validator");

const router = express.Router();
const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 10 : 1000,
  message: { error: "Too many login/register attempts, please try again later." }
});

const validateRegistration = [
  body("name").notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("role").isIn(["Citizen", "Company", "Verifier"]).withMessage("Invalid role"),
  body("walletAddress").matches(/^0x[a-fA-F0-9]{40}$/).withMessage("Invalid wallet address"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  }
];

router.post("/register", authLimiter, validateRegistration, registerUser);
router.post("/login", authLimiter, loginUser);
router.post("/logout", logoutUser);

const { protect } = require("../middleware/authMiddleware");
router.get("/me", protect, (req, res) => {
  res.json({
    _id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    walletAddress: req.user.walletAddress,
  });
});

module.exports = router;
