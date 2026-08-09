const AccessLog = require("../models/AccessLog");

/**
 * Middleware to record every access/verification attempt to MongoDB AccessLog
 */
const auditLog = async (req, res, next) => {
  // Capture the original send to intercept the response
  const originalSend = res.json;

  res.json = function(body) {
    res.json = originalSend;

    // Only log if we have the necessary info
    if (req.user && req.params.userId) {
      const isSuccess = res.statusCode >= 200 && res.statusCode < 300;
      
      AccessLog.create({
        companyId: req.user._id, // The one requesting the verification
        citizenId: req.params.userId,
        success: isSuccess
      }).catch(err => {
        console.error("Failed to write to AccessLog:", err.message);
      });
    }

    return res.json(body);
  };

  next();
};

module.exports = { auditLog };
