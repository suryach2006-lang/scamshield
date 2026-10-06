const mongoose = require('mongoose');
const Scan = require('../models/Scan');
const { isDbConnected } = require('../config/db');
const logger = require('../utils/logger');

// In-memory fallback cache in case MongoDB is offline in local dev/testing
const inMemoryScans = [];

/**
 * Validates and normalizes the scan payload before saving.
 * Strips any potential sensitive keys or unexpected fields.
 */
const validateScanPayload = (body) => {
  if (!body || typeof body !== 'object') {
    return { valid: false, message: 'Request body must be a valid JSON object.' };
  }

  // Handle both formats: { input, results } or { input, summary, ... }
  const input = body.input || {};
  const results = body.results || {
    summary: body.summary,
    riskIndicators: body.riskIndicators,
    webEvidence: body.webEvidence,
    jobEvidence: body.jobEvidence,
    newsEvidence: body.newsEvidence,
    verificationSignals: body.verificationSignals,
    metadata: body.metadata
  };

  const hasInput =
    (typeof input.companyName === 'string' && input.companyName.trim().length > 0) ||
    (typeof input.jobTitle === 'string' && input.jobTitle.trim().length > 0) ||
    (typeof input.jobDescription === 'string' && input.jobDescription.trim().length > 0);

  if (!hasInput) {
    return {
      valid: false,
      message: 'Scan input must include at least a company name, job title, or job description.'
    };
  }

  if (!results || !results.summary || !results.summary.assessment) {
    return {
      valid: false,
      message: 'Scan results must include a valid analysis summary with an assessment level.'
    };
  }

  // Clean sanitized input
  const sanitizedInput = {
    companyName: String(input.companyName || '').trim(),
    jobTitle: String(input.jobTitle || '').trim(),
    jobUrl: String(input.jobUrl || '').trim(),
    jobDescription: String(input.jobDescription || ''),
    salary: String(input.salary || '').trim(),
    location: String(input.location || '').trim(),
    recruiterContact: String(input.recruiterContact || '').trim()
  };

  // Clean sanitized results (explicitly ensure NO secrets or API keys are included)
  const sanitizedResults = {
    summary: {
      assessment: results.summary.assessment,
      headline: results.summary.headline || '',
      indicatorCounts: results.summary.indicatorCounts || {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        total: 0
      },
      disclaimer: results.summary.disclaimer || '',
      recommendations: Array.isArray(results.summary.recommendations) ? results.summary.recommendations : []
    },
    riskIndicators: Array.isArray(results.riskIndicators) ? results.riskIndicators : [],
    webEvidence: results.webEvidence || {},
    jobEvidence: results.jobEvidence || {},
    newsEvidence: results.newsEvidence || {},
    verificationSignals: results.verificationSignals || {},
    metadata: {
      analyzedAt: results.metadata?.analyzedAt || new Date().toISOString(),
      executionDurationMs: results.metadata?.executionDurationMs || 0,
      serpApiRequestsMade: results.metadata?.serpApiRequestsMade || 0,
      rulesEvaluatedCount: results.metadata?.rulesEvaluatedCount || 0
    }
  };

  return {
    valid: true,
    data: {
      input: sanitizedInput,
      results: sanitizedResults
    }
  };
};

/**
 * POST /api/scans
 * Saves a new completed ScamShield scan analysis.
 */
const createScan = async (req, res, next) => {
  try {
    const validation = validateScanPayload(req.body);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: validation.message
        }
      });
    }

    const { input, results } = validation.data;

    if (isDbConnected()) {
      const scanDoc = await Scan.create({
        input,
        results
      });

      logger.info(`[ScanController] Saved scan to MongoDB: ${scanDoc._id} (${input.companyName || input.jobTitle})`);

      return res.status(201).json({
        success: true,
        data: scanDoc
      });
    }

    // In-memory fallback
    const fallbackId = new mongoose.Types.ObjectId().toString();
    const fallbackScan = {
      _id: fallbackId,
      input,
      results,
      createdAt: new Date().toISOString()
    };

    inMemoryScans.unshift(fallbackScan);
    if (inMemoryScans.length > 100) inMemoryScans.pop();

    logger.info(`[ScanController] Saved scan to in-memory store: ${fallbackId}`);

    return res.status(201).json({
      success: true,
      data: fallbackScan
    });
  } catch (error) {
    logger.error(`[ScanController] Error in createScan: ${error.message}`);
    next(error);
  }
};

/**
 * GET /api/scans
 * Retrieves a list of recent scans, sorted by createdAt descending.
 */
const getScans = async (req, res, next) => {
  try {
    const rawLimit = parseInt(req.query.limit, 10);
    const limit = Number.isInteger(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 100) : 20;

    if (isDbConnected()) {
      // Lightweight projection for listing recent scans
      const scans = await Scan.find(
        {},
        {
          input: 1,
          'results.summary': 1,
          createdAt: 1
        }
      )
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      return res.status(200).json({
        success: true,
        count: scans.length,
        data: scans
      });
    }

    // In-memory fallback
    const list = inMemoryScans.slice(0, limit).map((scan) => ({
      _id: scan._id,
      input: scan.input,
      results: {
        summary: scan.results?.summary
      },
      createdAt: scan.createdAt
    }));

    return res.status(200).json({
      success: true,
      count: list.length,
      data: list
    });
  } catch (error) {
    logger.error(`[ScanController] Error in getScans: ${error.message}`);
    next(error);
  }
};

/**
 * GET /api/scans/:id
 * Retrieves a single scan with its complete evidence and indicators by ID.
 */
const getScanById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'A valid scan ID must be provided.'
        }
      });
    }

    if (isDbConnected()) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Scan with ID '${id}' was not found.`
          }
        });
      }

      const scan = await Scan.findById(id).lean();

      if (!scan) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Scan with ID '${id}' was not found.`
          }
        });
      }

      return res.status(200).json({
        success: true,
        data: scan
      });
    }

    // In-memory fallback
    const scan = inMemoryScans.find((s) => String(s._id) === String(id));

    if (!scan) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Scan with ID '${id}' was not found.`
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: scan
    });
  } catch (error) {
    logger.error(`[ScanController] Error in getScanById: ${error.message}`);
    next(error);
  }
};

module.exports = {
  createScan,
  getScans,
  getScanById
};
