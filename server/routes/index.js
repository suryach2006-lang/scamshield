const express = require('express');
const router = express.Router();
const healthRoutes = require('./healthRoutes');

// Mount modular sub-routes
router.use('/', healthRoutes);

module.exports = router;
