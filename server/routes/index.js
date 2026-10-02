const express = require('express');
const router = express.Router();
const healthRoutes = require('./healthRoutes');
const searchRoutes = require('./searchRoutes');

// Mount modular sub-routes
router.use('/', healthRoutes);
router.use('/search', searchRoutes);

module.exports = router;
