const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env
dotenv.config({ path: path.resolve(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes');
const notFoundHandler = require('./middleware/notFoundHandler');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const app = express();

// Core middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging in non-test environments
if (process.env.NODE_ENV !== 'test') {
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.originalUrl}`);
    next();
  });
}

// API Routes
app.use('/api', apiRoutes);

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Server startup configuration
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`ScamShield backend running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received. Closing HTTP server gracefully...`);
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

module.exports = { app, server };
