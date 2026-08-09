const mongoose = require('mongoose');
const KYCDocument = require('./models/KYCDocument');
require('dotenv').config();

async function tamper() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/kyc_db');
    console.log('Connected to DB...');
    
    const userId = process.argv[2];
    
    // Find KYC document
    let query = {};
    if (userId) {
      query.userId = userId;
    }
    
    // Sort by _id descending to get the most recently created doc if no userId provided
    const doc = await KYCDocument.findOne(query).sort({ _id: -1 });
    if (!doc) {
      console.log('No KYC documents found to tamper with.');
      process.exit(0);
    }

    console.log(`Original IV: ${doc.ivHex}`);
    
    // Alter the IV slightly (changing the first character)
    const altered = doc.ivHex.replace(/^./, doc.ivHex[0] === '0' ? '1' : '0');
    doc.ivHex = altered;
    
    await doc.save();
    console.log(`Tampered IV: ${doc.ivHex}`);
    console.log('Tamper successful! The decryption will now fail to produce the original data, causing a hash mismatch in the UI.');
    
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

tamper();
