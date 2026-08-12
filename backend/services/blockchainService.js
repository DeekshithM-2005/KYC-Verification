const { ethers } = require("ethers");
const dotenv = require("dotenv");

dotenv.config();

// Load the compiled KYCRegistry ABI dynamically from the contracts project
const KYCRegistryArtifact = require("../../contracts/artifacts/contracts/KYCRegistry.sol/KYCRegistry.json");

// Initialize Provider, Signer, and Contract (gracefully handles missing/invalid config)
let provider = null;
let signer = null;
let kycContract = null;
let blockchainReady = false;

try {
  provider = new ethers.JsonRpcProvider(process.env.GANACHE_URL);
  signer = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
  kycContract = new ethers.Contract(
    process.env.CONTRACT_ADDRESS,
    KYCRegistryArtifact.abi,
    signer
  );
  blockchainReady = true;
  console.log("✅ Blockchain service initialized successfully");
} catch (error) {
  console.warn("⚠️  Blockchain service not available:", error.shortMessage || error.message);
  console.warn("   Auth (login/register) will still work, but blockchain features are disabled.");
  console.warn("   Fix: Set a valid DEPLOYER_PRIVATE_KEY (64 hex chars) in your .env file.");
}

// Helper to check if blockchain is ready before any call
function ensureBlockchain() {
  if (!blockchainReady) {
    throw new Error("Blockchain service is not configured. Set a valid DEPLOYER_PRIVATE_KEY in .env.");
  }
}

/**
 * Registers a KYC document hash on the blockchain.
 * @param {string} hash - SHA-256 hash of the document data.
 * @param {string} ipfsCID - IPFS Content ID of the encrypted document.
 * @param {string} userId - Unique identifier of the user.
 * @returns {Promise<string>} Transaction hash
 */
async function registerKYC(hash, ipfsCID, userId) {
  try {
    ensureBlockchain();
    const tx = await kycContract.registerKYC(hash, ipfsCID, userId);
    const receipt = await tx.wait();
    return receipt.hash;
  } catch (error) {
    console.error("Blockchain Service Error (registerKYC):", error);
    throw new Error(`Failed to register KYC on-chain: ${error.message}`);
  }
}

/**
 * Requests access to a user's KYC.
 * @param {string} companyAddress - Address of the company requesting.
 * @param {string} userId - Unique identifier of the user.
 * @returns {Promise<string>} Transaction hash
 */
async function requestAccess(companyAddress, userId) {
  try {
    ensureBlockchain();
    const tx = await kycContract.requestAccess(companyAddress, userId);
    const receipt = await tx.wait();
    return receipt.hash;
  } catch (error) {
    console.error("Blockchain Service Error (requestAccess):", error);
    throw new Error(`Failed to request access on-chain: ${error.message}`);
  }
}

/**
 * Approves a company's access to the user's KYC.
 * @param {string} userId - Unique identifier of the user.
 * @param {string} companyAddress - Address of the company being approved.
 * @returns {Promise<string>} Transaction hash
 */
async function approveAccess(userId, companyAddress) {
  try {
    ensureBlockchain();
    const tx = await kycContract.approveAccess(userId, companyAddress);
    const receipt = await tx.wait();
    return receipt.hash;
  } catch (error) {
    console.error("Blockchain Service Error (approveAccess):", error);
    throw new Error(`Failed to approve access on-chain: ${error.message}`);
  }
}

/**
 * Checks if a user has a registered KYC.
 * @param {string} userId - Unique identifier of the user.
 * @returns {Promise<boolean>} True if registered.
 */
async function checkKYCStatus(userId) {
  try {
    ensureBlockchain();
    return await kycContract.checkKYCStatus(userId);
  } catch (error) {
    console.error("Blockchain Service Error (checkKYCStatus):", error);
    throw new Error(`Failed to check KYC status: ${error.message}`);
  }
}

/**
 * Retrieves the KYC record for a given user from the blockchain.
 * @param {string} userId - Unique identifier of the user.
 * @returns {Promise<{docHash: string, ipfsCID: string, isRegistered: boolean, owner: string}>}
 */
async function getKYCRecord(userId) {
  try {
    ensureBlockchain();
    const record = await kycContract.kycRecords(userId);
    return {
      docHash: record.docHash,
      ipfsCID: record.ipfsCID,
      isRegistered: record.isRegistered,
      owner: record.owner
    };
  } catch (error) {
    console.error("Blockchain Service Error (getKYCRecord):", error);
    throw new Error(`Failed to get KYC record: ${error.message}`);
  }
}

module.exports = {
  registerKYC,
  requestAccess,
  approveAccess,
  checkKYCStatus,
  getKYCRecord
};
