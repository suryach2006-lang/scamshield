/**
 * Analyze Controller
 * Handles POST /api/analyze requests for job listing threat analysis.
 */

const analysisService = require('../services/analysisService');
const logger = require('../utils/logger');

/**
 * Validates whether the incoming payload contains sufficient content for analysis.
 * @param {Object} body
 * @returns {boolean}
 */
const hasInspectableContent = (body) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return false;
  }

  const candidateFields = [
    'jobTitle',
    'job_title',
    'title',
    'companyName',
    'company_name',
    'company',
    'jobDescription',
    'job_description',
    'description',
    'jobUrl',
    'job_url',
    'url',
    'salary',
    'location',
    'recruiterContact',
    'recruiter_contact',
    'contact',
    'recruiter'
  ];

  return candidateFields.some((field) => {
    const val = body[field];
    if (typeof val === 'string') return val.trim().length > 0;
    if (typeof val === 'object' && val !== null) return Object.keys(val).length > 0;
    if (typeof val === 'number') return true;
    return false;
  });
};

/**
 * Controller handler for POST /api/analyze
 */
const analyzeJob = async (req, res, next) => {
  try {
    if (!hasInspectableContent(req.body)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'At least one listing attribute must be provided (jobTitle, companyName, jobDescription, jobUrl, or recruiterContact).'
        }
      });
    }

    // Optional flag to skip live web search (e.g. for rapid offline checks)
    const skipWebSearch = req.query.skipWebSearch === 'true' || req.body.skipWebSearch === true;

    const analysisResult = await analysisService.analyzeJobListing(req.body, {
      enableWebSearch: !skipWebSearch
    });

    return res.status(200).json({
      success: true,
      data: analysisResult
    });
  } catch (error) {
    logger.error(`[AnalyzeController] Error in analyzeJob: ${error.message}`);
    next(error);
  }
};

module.exports = {
  analyzeJob
};
