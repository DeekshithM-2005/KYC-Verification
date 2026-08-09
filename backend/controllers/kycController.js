const cryptoService = require("../services/cryptoService");
const ipfsService = require("../services/ipfsService");
const blockchainService = require("../services/blockchainService");

/**
 * Endpoint: POST /api/kyc/upload-document
 * Description: Encrypts document data, uploads to IPFS, hashes it, and links it on-chain.
 */
async function uploadDocument(req, res) {
  try {
    const { documentData, userId } = req.body;

    if (!documentData || !userId) {
      return res.status(400).json({ error: "Missing documentData or userId" });
    }

    const rawBuffer = Buffer.from(documentData, "utf-8");

    // 1. Hash the original document (tamper-proof footprint)
    const docHash = cryptoService.hashDocument(rawBuffer);
    console.log(`[1] Document Hashed: ${docHash}`);

    // 2. Encrypt the document (AES-256)
    const { encryptedBuffer, ivHex } = cryptoService.encryptDocument(rawBuffer);
    console.log(`[2] Document Encrypted (IV: ${ivHex})`);

    // 3. Upload encrypted blob to IPFS
    const ipfsCID = await ipfsService.uploadToIPFS(encryptedBuffer, `kyc_${userId}.enc`);
    console.log(`[3] Uploaded to IPFS. CID: ${ipfsCID}`);

    // 4. Register on-chain (links hash and CID to user)
    // This will throw if already registered
    const txHash = await blockchainService.registerKYC(docHash, ipfsCID, userId);
    console.log(`[4] Registered on Blockchain. TxHash: ${txHash}`);

    // 5. Save ivHex to MongoDB only if on-chain succeeds
    const KYCDocument = require("../models/KYCDocument");
    await KYCDocument.findOneAndUpdate(
      { userId },
      { ivHex },
      { upsert: true, new: true }
    );
    console.log(`[5] Saved IV to DB for decryption later.`);

    return res.status(200).json({
      message: "KYC document securely uploaded and registered.",
      userId,
      docHash,
      ipfsCID,
      ivHex,
      transactionHash: txHash
    });
  } catch (error) {
    console.error("KYC Controller Error (uploadDocument):", error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Endpoint: POST /api/kyc/verify-integrity
 * Description: Fetches from IPFS, decrypts, hashes, and compares against on-chain hash.
 */
async function verifyIntegrity(req, res) {
  try {
    const { userId, ipfsCID, ivHex, expectedHash } = req.body;
    
    // 1. Fetch encrypted blob from IPFS
    const encryptedBuffer = await ipfsService.fetchFromIPFS(ipfsCID);
    
    // 2. Decrypt
    const rawBuffer = cryptoService.decryptDocument(encryptedBuffer, ivHex);
    
    // 3. Hash the decrypted data
    const computedHash = cryptoService.hashDocument(rawBuffer);
    
    // 4. Compare
    const isIntact = computedHash === expectedHash;
    
    return res.status(200).json({
      isIntact,
      computedHash,
      expectedHash,
      decryptedData: isIntact ? rawBuffer.toString("utf-8") : null
    });
  } catch (error) {
    console.error("KYC Controller Error (verifyIntegrity):", error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Endpoint: GET /api/kyc/status/:userId
 */
async function getStatus(req, res) {
  try {
    const { userId } = req.params;
    const isRegistered = await blockchainService.checkKYCStatus(userId);
    
    return res.status(200).json({
      userId,
      isRegistered
    });
  } catch (error) {
    console.error("KYC Controller Error (getStatus):", error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Endpoint: GET /api/kyc/verify/:userId
 * Description: Fetches document from IPFS, decrypts, computes hash, and compares with on-chain hash.
 */
async function verifyUserKYC(req, res) {
  try {
    const { userId } = req.params;

    // 1. Get IV from DB
    const KYCDocument = require("../models/KYCDocument");
    const kycDoc = await KYCDocument.findOne({ userId });
    if (!kycDoc) {
      return res.status(404).json({ error: "KYC Document metadata not found in DB." });
    }

    // 2. Get on-chain record
    const onChainRecord = await blockchainService.getKYCRecord(userId);
    if (!onChainRecord.isRegistered) {
      return res.status(404).json({ error: "KYC not registered on-chain." });
    }

    const { docHash: expectedHash, ipfsCID } = onChainRecord;

    // 3. Fetch from IPFS
    const encryptedBuffer = await ipfsService.fetchFromIPFS(ipfsCID);

    // 4. Decrypt
    const rawBuffer = cryptoService.decryptDocument(encryptedBuffer, kycDoc.ivHex);

    // 5. Hash & Compare
    const computedHash = cryptoService.hashDocument(rawBuffer);
    const isIntact = computedHash === expectedHash;
    console.log(`[Verify] Expected: ${expectedHash}, Computed: ${computedHash}, Intact: ${isIntact}`);

    return res.status(200).json({
      isIntact,
      computedHash,
      expectedHash,
      // For MVP demo, returning the decrypted data to prove it works
      decryptedData: isIntact ? rawBuffer.toString("utf-8") : null
    });

  } catch (error) {
    console.error("KYC Controller Error (verifyUserKYC):", error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Endpoint: POST /api/kyc/request-access
 * Description: Company requests access to Citizen's KYC.
 */
async function requestAccess(req, res) {
  try {
    const { citizenId } = req.body;
    const companyId = req.user._id;

    // We need the citizen's user record to interact on-chain (assumes userId = mongo _id)
    // Wait, in previous days userId was arbitrary. Now it should be the Mongo _id.
    
    // Save to Mongo
    const VerificationRequest = require("../models/VerificationRequest");
    const newRequest = await VerificationRequest.create({
      citizenId,
      companyId,
      status: "Pending"
    });

    // Call blockchain
    // Note: blockchain requires company address. In this setup, we use the company's walletAddress from the DB.
    const User = require("../models/User");
    const company = await User.findById(companyId);
    
    if (!company || !company.walletAddress) {
       return res.status(400).json({ error: "Company wallet address not found" });
    }

    const txHash = await blockchainService.requestAccess(company.walletAddress, citizenId.toString());

    return res.status(200).json({
      message: "Access requested successfully",
      requestId: newRequest._id,
      transactionHash: txHash
    });
  } catch (error) {
    console.error("KYC Controller Error (requestAccess):", error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Endpoint: POST /api/kyc/approve-access
 * Description: Citizen approves access for a company.
 */
async function approveAccess(req, res) {
  try {
    const { requestId } = req.body;
    const citizenId = req.user._id; // The logged-in citizen

    const VerificationRequest = require("../models/VerificationRequest");
    const request = await VerificationRequest.findById(requestId).populate("companyId");

    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }
    
    // Ensure only the correct citizen can approve
    if (request.citizenId.toString() !== citizenId.toString()) {
      return res.status(403).json({ error: "Not authorized to approve this request" });
    }

    request.status = "Approved";
    request.resolvedAt = new Date();
    await request.save();

    const companyAddress = request.companyId.walletAddress;

    // Call blockchain
    const txHash = await blockchainService.approveAccess(citizenId.toString(), companyAddress);

    // Log the access event
    const AccessLog = require("../models/AccessLog");
    await AccessLog.create({
      companyId: request.companyId._id,
      citizenId
    });

    return res.status(200).json({
      message: "Access approved successfully",
      transactionHash: txHash
    });
  } catch (error) {
    console.error("KYC Controller Error (approveAccess):", error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Endpoint: GET /api/kyc/requests/citizen
 * Description: Get all access requests for the logged-in citizen
 */
async function getCitizenRequests(req, res) {
  try {
    const VerificationRequest = require("../models/VerificationRequest");
    const requests = await VerificationRequest.find({ citizenId: req.user._id })
      .populate("companyId", "name walletAddress email")
      .sort({ createdAt: -1 });
    return res.status(200).json(requests);
  } catch (error) {
    console.error("KYC Controller Error (getCitizenRequests):", error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Endpoint: GET /api/kyc/requests/company
 * Description: Get all access requests made by the logged-in company
 */
async function getCompanyRequests(req, res) {
  try {
    const VerificationRequest = require("../models/VerificationRequest");
    const requests = await VerificationRequest.find({ companyId: req.user._id })
      .populate("citizenId", "name walletAddress")
      .sort({ createdAt: -1 });
    return res.status(200).json(requests);
  } catch (error) {
    console.error("KYC Controller Error (getCompanyRequests):", error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Endpoint: GET /api/kyc/audit-logs
 * Description: Get all access logs for the system (Verifier use)
 */
async function getAuditLogs(req, res) {
  try {
    const AccessLog = require("../models/AccessLog");
    const logs = await AccessLog.find()
      .populate("companyId", "name walletAddress")
      .populate("citizenId", "name walletAddress")
      .sort({ accessedAt: -1 });
    return res.status(200).json(logs);
  } catch (error) {
    console.error("KYC Controller Error (getAuditLogs):", error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Endpoint: GET /api/kyc/citizens
 * Description: Get all citizens and their KYC upload status (Verifier use)
 */
async function getAllCitizens(req, res) {
  try {
    const User = require("../models/User");
    const KYCDocument = require("../models/KYCDocument");
    
    const citizens = await User.find({ role: "Citizen" }, "-password");
    
    // For each citizen, check if they have a KYC document in DB
    const results = [];
    for (const citizen of citizens) {
      const doc = await KYCDocument.findOne({ userId: citizen._id });
      results.push({
        ...citizen.toObject(),
        hasUploaded: !!doc
      });
    }
    
    return res.status(200).json(results);
  } catch (error) {
    console.error("KYC Controller Error (getAllCitizens):", error);
    return res.status(500).json({ error: error.message });
  }
}

module.exports = {
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
};
