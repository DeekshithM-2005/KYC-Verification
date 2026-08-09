const mongoose = require("mongoose");

const VerificationRequestSchema = new mongoose.Schema({
  citizenId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["Pending", "Approved", "Denied"], default: "Pending" },
  resolvedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model("VerificationRequest", VerificationRequestSchema);
