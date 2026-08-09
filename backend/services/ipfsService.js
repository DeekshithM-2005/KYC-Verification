const pinataSDK = require("@pinata/sdk");
const fs = require("fs");
const path = require("path");
const os = require("os");
const axios = require("axios");

let pinata;
const isDev = process.env.PINATA_API_KEY === "dev" || !process.env.PINATA_API_KEY;

if (!isDev) {
  pinata = new pinataSDK(process.env.PINATA_API_KEY, process.env.PINATA_SECRET_KEY);
}

// Temporary in-memory store for dev mocking
const mockStorage = new Map();

/**
 * Uploads an encrypted buffer to IPFS via Pinata.
 * @param {Buffer} encryptedBuffer - The encrypted data to upload.
 * @param {string} fileName - The name of the file.
 * @returns {Promise<string>} The IPFS CID.
 */
async function uploadToIPFS(encryptedBuffer, fileName = "document.enc") {
  if (isDev) {
    console.log("Mocking Pinata upload for dev environment...");
    const fakeCID = "QmMock" + Date.now() + Math.random().toString(36).substring(7);
    mockStorage.set(fakeCID, encryptedBuffer);
    return fakeCID;
  }

  // Create a temporary file because @pinata/sdk works best with readable streams
  const tempPath = path.join(os.tmpdir(), fileName);
  fs.writeFileSync(tempPath, encryptedBuffer);

  try {
    const stream = fs.createReadStream(tempPath);
    const options = {
      pinataMetadata: {
        name: fileName,
      }
    };
    
    const result = await pinata.pinFileToIPFS(stream, options);
    return result.IpfsHash;
  } catch (error) {
    console.error("Pinata Upload Error:", error);
    throw new Error("Failed to upload to IPFS: " + error.message);
  } finally {
    // Clean up temp file
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
  }
}

/**
 * Retrieves a file from IPFS.
 * @param {string} cid - The IPFS CID.
 * @returns {Promise<Buffer>} The encrypted file buffer.
 */
async function fetchFromIPFS(cid) {
  if (isDev) {
    console.log(`Mocking Pinata fetch for CID: ${cid}`);
    const buffer = mockStorage.get(cid);
    if (!buffer) throw new Error("Mock CID not found in local memory");
    return buffer;
  }

  try {
    const url = `${process.env.PINATA_GATEWAY}/${cid}`;
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(response.data);
  } catch (error) {
    console.error("IPFS Fetch Error:", error);
    throw new Error("Failed to fetch from IPFS: " + error.message);
  }
}

module.exports = {
  uploadToIPFS,
  fetchFromIPFS
};
