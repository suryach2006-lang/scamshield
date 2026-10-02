const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');

// GET /api/search/web
router.get('/web', searchController.getWebSearch);

// GET /api/search/jobs
router.get('/jobs', searchController.getJobsSearch);

// GET /api/search/news
router.get('/news', searchController.getNewsSearch);

module.exports = router;
