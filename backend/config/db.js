const mongoose = require("mongoose");

/**
 * Connect to MongoDB with retry logic.
 * Uses the MONGO_URI from environment variables.
 */
let memoryServer = null;

const connectDB = async () => {
  try {
    // Try to connect to Atlas first
    if (process.env.USE_LOCAL_DB !== 'true') {
      const conn = await mongoose.connect(process.env.MONGO_URI);
      console.log(`✅ MongoDB connected to Atlas: ${conn.connection.host}`);
      return;
    }
    throw new Error('Forced local DB');
  } catch (error) {
    if (process.env.USE_LOCAL_DB !== 'true') {
      console.warn(`⚠️ Atlas connection failed: ${error.message}`);
      console.warn("   Falling back to local in-memory database...");
    }
    
    try {
      // Fallback to in-memory database
      const { MongoMemoryServer } = require('mongodb-memory-server');
      if (!memoryServer) {
        memoryServer = await MongoMemoryServer.create();
      }
      const uri = memoryServer.getUri();
      await mongoose.connect(uri);
      console.log(`✅ MongoDB connected to Local In-Memory DB`);
    } catch (fallbackError) {
      console.error(`❌ Failed to start local database: ${fallbackError.message}`);
      setTimeout(connectDB, 5000);
    }
  }
};

module.exports = connectDB;
