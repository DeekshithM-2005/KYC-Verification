const express = require("express");
const { 
  uploadDocument, 
  verifyIntegrity, 
  getStatus, 
  requestAccess, 
  approveAccess,
  verifyUserKYC,
  getCitizenRequests,
  getCompanyRequests,
  getAuditLogs,
  getAllCitizens
} = require("../controllers/kycController");
const { protect, restrictTo } = require("../middleware/authMiddleware");
const { auditLog } = require("../middleware/auditMiddleware");

const { body, param, validationResult } = require("express-validator");

const router = express.Router();

const validateResult = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

// Citizen routes
router.post(
  "/upload-document", 
  protect, 
  restrictTo("Citizen"), 
  body("documentData").isString().notEmpty(),
  validateResult,
  uploadDocument
);
router.post(
  "/approve-access", 
  protect, 
  restrictTo("Citizen"), 
  body("requestId").isMongoId(),
  validateResult,
  approveAccess
);
router.get("/requests/citizen", protect, restrictTo("Citizen"), getCitizenRequests);

// Company routes
router.post(
  "/request-access", 
  protect, 
  restrictTo("Company"), 
  body("citizenId").isMongoId(),
  validateResult,
  requestAccess
);
router.get("/requests/company", protect, restrictTo("Company"), getCompanyRequests);

// Verifier/Company routes for verification
router.post("/verify-integrity", protect, restrictTo("Company", "Verifier"), verifyIntegrity);
router.get("/verify/:userId", protect, restrictTo("Company", "Verifier"), auditLog, verifyUserKYC);
router.get("/audit-logs", protect, restrictTo("Verifier"), getAuditLogs);
router.get("/citizens", protect, restrictTo("Verifier"), getAllCitizens);

// Public or general protected routes
router.get("/status/:userId", protect, getStatus);

module.exports = router;
