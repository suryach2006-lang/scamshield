/**
 * Health check service providing system status details.
 */
const getHealthStatus = () => {
  return {
    status: 'OK',
    message: 'ScamShield backend service is running smoothly',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    environment: process.env.NODE_ENV || 'development'
  };
};

module.exports = {
  getHealthStatus
};
