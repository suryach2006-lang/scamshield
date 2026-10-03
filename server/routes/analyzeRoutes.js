const express = require('express');
const router = express.Router();
const analyzeController = require('../controllers/analyzeController');

/**
 * Route: POST /api/analyze
 * Analyzes a job listing for evidence-based risk indicators.
 */
router.post('/', analyzeController.analyzeJob);

module.exports = router;
