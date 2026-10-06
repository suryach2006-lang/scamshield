const express = require('express');
const router = express.Router();
const { createScan, getScans, getScanById } = require('../controllers/scanController');

// POST /api/scans - Save a new scan analysis
router.post('/', createScan);

// GET /api/scans - List recent scans
router.get('/', getScans);

// GET /api/scans/:id - Retrieve a specific scan by ID
router.get('/:id', getScanById);

module.exports = router;
