const mongoose = require('mongoose');
const logger = require('../utils/logger');

let isConnected = false;

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/scamshield';

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 2500
    });

    isConnected = true;
    const sanitizedUri = mongoUri.replace(/:[^:@]+@/, ':****@');
    logger.info(`[MongoDB] Connected successfully to ${sanitizedUri} (${conn.connection.name})`);

    mongoose.connection.on('error', (err) => {
      logger.error(`[MongoDB] Connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      logger.warn('[MongoDB] Connection lost.');
    });

    return true;
  } catch (error) {
    isConnected = false;
    logger.warn(`[MongoDB] Could not establish connection to ${mongoUri}: ${error.message}`);
    logger.warn('[MongoDB] Running with in-memory storage fallback for scans.');
    return false;
  }
};

const isDbConnected = () => {
  return isConnected && mongoose.connection.readyState === 1;
};

module.exports = {
  connectDB,
  isDbConnected
};
