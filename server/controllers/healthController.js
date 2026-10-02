const healthService = require('../services/healthService');

/**
 * Controller for health check endpoint.
 * GET /api/health
 */
const getHealth = (req, res, next) => {
  try {
    const healthData = healthService.getHealthStatus();
    return res.status(200).json(healthData);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHealth
};
