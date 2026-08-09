const crypto = require("crypto");
require("dotenv").config();

const MASTER_KEY = process.env.AES_MASTER_KEY;
if (!MASTER_KEY || MASTER_KEY.length !== 64) {
    console.warn("WARNING: Invalid or missing AES_MASTER_KEY. Expected 64-char hex string.");
}

const ALGORITHM = "aes-256-cbc";

/**
 * Encrypts a buffer using AES-256-CBC.
 * @param {Buffer} buffer - The raw document data buffer.
 * @returns {Object} { encryptedBuffer, ivHex }
 */
function encryptDocument(buffer) {
  const iv = crypto.randomBytes(16);
  const key = Buffer.from(MASTER_KEY || crypto.randomBytes(32).toString('hex'), 'hex');
  console.log(`[Crypto] Encrypting with Key length: ${key.length}, IV: ${iv.toString('hex')}`);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encryptedBuffer = Buffer.concat([cipher.update(buffer), cipher.final()]);
  
  return { 
    encryptedBuffer, 
    ivHex: iv.toString('hex') 
  };
}

function decryptDocument(encryptedBuffer, ivHex) {
  const iv = Buffer.from(ivHex, 'hex');
  const key = Buffer.from(MASTER_KEY, 'hex');
  console.log(`[Crypto] Decrypting with Key length: ${key.length}, IV: ${ivHex}`);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  const decryptedBuffer = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
  
  return decryptedBuffer;
}

/**
 * Hashes a buffer using SHA-256.
 * @param {Buffer} buffer - The data to hash.
 * @returns {string} The SHA-256 hash as a hex string.
 */
function hashDocument(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

module.exports = {
  encryptDocument,
  decryptDocument,
  hashDocument
};
