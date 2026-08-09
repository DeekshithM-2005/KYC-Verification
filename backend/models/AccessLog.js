const mongoose = require("mongoose");

const AccessLogSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  citizenId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  accessedAt: { type: Date, default: Date.now },
  success: { type: Boolean, default: true }
});

module.exports = mongoose.model("AccessLog", AccessLogSchema);
