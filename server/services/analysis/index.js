/**
 * ScamShield Analysis Engine - Main Facade
 * Orchestrates normalization, web intelligence gathering, rule engine evaluation,
 * and structured response formatting.
 */

const { normalizeInput } = require('./normalizer');
const { defaultEngine, RuleEngine } = require('./ruleEngine');
const { gatherWebIntelligence } = require('./webIntelligenceService');
const { SEVERITY, ASSESSMENT, INDICATOR_TYPES, STANDARD_DISCLAIMER } = require('./constants');
const logger = require('../../utils/logger');

/**
 * Analyzes a job listing / company input and identifies evidence-based warning indicators.
 *
 * @param {Object} rawInput - Job listing input
 * @param {Object} [options] - Optional execution flags
 * @param {boolean} [options.enableWebSearch=true] - Whether to perform SerpApi web searches
 * @param {RuleEngine} [options.engine] - Optional custom rule engine instance
 * @returns {Promise<Object>} Structured analysis result
 */
const analyzeJobListing = async (rawInput, options = {}) => {
  const startTime = Date.now();

  // 1. Normalize input across flexible client naming conventions
  const normalized = normalizeInput(rawInput);

  // 2. Select rule engine instance
  const engine = options.engine || defaultEngine;

  // 3. Execute deterministic local rules
  const ruleEvaluation = engine.executeRules(normalized);

  // 4. Gather authentic web intelligence via SerpApi (if enabled)
  let webResult = {
    webEvidence: {
      searchPerformed: false,
      status: 'SKIPPED',
      companyQuery: null,
      companyPresence: null,
      reputationQuery: null,
      reputationAlerts: []
    },
    additionalIndicators: [],
    additionalMissingSignals: []
  };

  const shouldSearchWeb = options.enableWebSearch !== false;

  if (shouldSearchWeb && normalized.companyName) {
    try {
      webResult = await gatherWebIntelligence(normalized, { enabled: true });
    } catch (err) {
      logger.error(`[AnalysisService] Web intelligence gathering failed: ${err.message}`);
      webResult.webEvidence.status = 'ERROR';
      webResult.webEvidence.error = err.message;
    }
  }

  // 5. Aggregate indicators and missing signals
  const combinedIndicators = [
    ...ruleEvaluation.indicators,
    ...webResult.additionalIndicators
  ];

  const combinedMissingSignals = [
    ...ruleEvaluation.missingSignals,
    ...webResult.additionalMissingSignals
  ];

  // 6. Compute evidence-based risk assessment (NO arbitrary percentages)
  const assessmentSummary = engine.calculateAssessment(combinedIndicators, normalized);

  const durationMs = Date.now() - startTime;

  // 7. Assemble structured JSON distinguishing the four key elements:
  //    1. User-provided information
  //    2. Web evidence
  //    3. Detected warning indicators
  //    4. Missing verification signals
  return {
    summary: {
      assessment: assessmentSummary.assessment,
      headline: assessmentSummary.headline,
      indicatorCounts: assessmentSummary.indicatorCounts,
      disclaimer: assessmentSummary.disclaimer,
      recommendations: assessmentSummary.recommendations
    },
    userProvided: normalized.userFacingInput,
    webEvidence: webResult.webEvidence,
    warningIndicators: combinedIndicators,
    missingVerificationSignals: combinedMissingSignals,
    metadata: {
      analyzedAt: new Date().toISOString(),
      executionDurationMs: durationMs,
      rulesEvaluatedCount: engine.getRegisteredRuleIds().length
    }
  };
};

module.exports = {
  analyzeJobListing,
  normalizeInput,
  RuleEngine,
  defaultEngine,
  SEVERITY,
  ASSESSMENT,
  INDICATOR_TYPES,
  STANDARD_DISCLAIMER
};
