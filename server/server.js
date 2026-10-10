const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables from .env
dotenv.config({ path: path.resolve(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes');
const notFoundHandler = require('./middleware/notFoundHandler');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const { connectDB } = require('./config/db');
const mongoose = require('mongoose');

const app = express();

// Core middleware
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging in non-test environments
if (process.env.NODE_ENV !== 'test') {
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.originalUrl}`);
    next();
  });
}

// Connect to MongoDB
connectDB();

// API Routes
app.use('/api', apiRoutes);

// Static frontend build directory (Vite outputs to client/dist)
const clientBuildPath = path.resolve(__dirname, '../client/dist');
app.use(express.static(clientBuildPath));

// React SPA fallback for non-API frontend routes
app.get('{*splat}', (req, res, next) => {
  // Ensure unmatched API routes bypass the SPA fallback and receive JSON error responses
  if (/^\/api(\/|$)/.test(req.originalUrl) || /^\/api(\/|$)/.test(req.path)) {
    return next();
  }

  const indexPath = path.join(clientBuildPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath, (err) => {
      if (err) {
        next(err);
      }
    });
  }
  next();
});

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Server startup configuration
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`ScamShield backend running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    logger.error(`[Server] Port ${PORT} is already in use. Please terminate any running instance or specify a different PORT.`);
  } else {
    logger.error(`[Server] Startup error: ${err.message}`);
  }
  process.exit(1);
});


// Handle graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received. Closing HTTP server gracefully...`);
  if (mongoose.connection.readyState !== 0) {
    try {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed.');
    } catch (err) {
      logger.error(`Error closing MongoDB connection: ${err.message}`);
    }
  }
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

module.exports = { app, server };
