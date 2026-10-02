const serpApiService = require('../services/serpApiService');

/**
 * Controller to handle web search requests.
 * GET /api/search/web?q=...&gl=...&hl=...&num=...&page=...
 */
const getWebSearch = async (req, res, next) => {
  try {
    const { q, gl, hl, num, page } = req.query;

    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Query parameter "q" is required and cannot be empty.'
        }
      });
    }

    const searchResults = await serpApiService.searchGoogle({
      q: q.trim(),
      gl,
      hl,
      num,
      page
    });

    return res.status(200).json({
      success: true,
      data: searchResults
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to handle jobs search requests.
 * GET /api/search/jobs?q=...&location=...&gl=...&hl=...
 */
const getJobsSearch = async (req, res, next) => {
  try {
    const { q, location, gl, hl } = req.query;

    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Query parameter "q" is required and cannot be empty.'
        }
      });
    }

    const searchResults = await serpApiService.searchJobs({
      q: q.trim(),
      location,
      gl,
      hl
    });

    return res.status(200).json({
      success: true,
      data: searchResults
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to handle news search requests.
 * GET /api/search/news?q=...&gl=...&hl=...
 */
const getNewsSearch = async (req, res, next) => {
  try {
    const { q, gl, hl } = req.query;

    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Query parameter "q" is required and cannot be empty.'
        }
      });
    }

    const searchResults = await serpApiService.searchNews({
      q: q.trim(),
      gl,
      hl
    });

    return res.status(200).json({
      success: true,
      data: searchResults
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWebSearch,
  getJobsSearch,
  getNewsSearch
};
