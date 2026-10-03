const express = require('express');
const router = express.Router();
const healthRoutes = require('./healthRoutes');
const searchRoutes = require('./searchRoutes');
const analyzeRoutes = require('./analyzeRoutes');

// Mount modular sub-routes
router.use('/', healthRoutes);
router.use('/search', searchRoutes);
router.use('/analyze', analyzeRoutes);

module.exports = router;

