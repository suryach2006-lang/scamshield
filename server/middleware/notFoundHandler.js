/**
 * Middleware to handle 404 (Not Found) routes.
 */
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Resource not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

module.exports = notFoundHandler;
