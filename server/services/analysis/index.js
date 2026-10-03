/**
 * ScamShield Analysis Engine - Main Facade
 * Connects normalization, SerpApi multi-engine intelligence (Web, Google Jobs, Google News),
 * modular rule evaluation, and structured response formatting.
 */

const { normalizeInput } = require('./normalizer');
const { defaultEngine, RuleEngine } = require('./ruleEngine');
const { gatherSerpApiEvidence } = require('./serpApiIntelligenceService');
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
  const localRuleEvaluation = engine.executeRules(normalized);

  // 4. Gather SerpApi intelligence across Web, Google Jobs, and Google News
  const shouldSearch = options.enableWebSearch !== false;

  let serpApiResult = {
    webEvidence: {
      searchPerformed: false,
      status: 'SKIPPED',
      query: null,
      resultCount: 0,
      knowledgeGraph: null,
      officialDomain: null,
      topResults: []
    },
    jobEvidence: {
      searchPerformed: false,
      status: 'SKIPPED',
      query: null,
      location: null,
      resultCount: 0,
      matchedListingsCount: 0,
      corroborationStatus: 'SEARCH_SKIPPED',
      listings: []
    },
    newsEvidence: {
      searchPerformed: false,
      status: 'SKIPPED',
      query: null,
      resultCount: 0,
      alertsFound: false,
      articles: [],
      flaggedAlerts: []
    },
    additionalIndicators: [],
    verifiedSignals: [],
    missingSignals: [],
    serpApiRequestsMade: 0
  };

  if (shouldSearch) {
    try {
      serpApiResult = await gatherSerpApiEvidence(normalized, { enabled: true });
    } catch (err) {
      logger.error(`[AnalysisService] SerpApi intelligence gathering failed: ${err.message}`);
    }
  }

  // 5. Feed structured evidence into the analysis layer
  const combinedIndicators = [
    ...localRuleEvaluation.indicators,
    ...serpApiResult.additionalIndicators
  ];

  const allMissingSignals = [
    ...localRuleEvaluation.missingSignals,
    ...serpApiResult.missingSignals
  ];

  const allVerifiedSignals = [
    ...serpApiResult.verifiedSignals
  ];

  // 6. Compute evidence-based risk assessment (NO arbitrary percentages)
  const assessmentSummary = engine.calculateAssessment(combinedIndicators, normalized);

  const durationMs = Date.now() - startTime;

  // 7. Structured Verification Signals
  const verificationSignals = {
    verifiedSignals: allVerifiedSignals,
    missingSignals: allMissingSignals,
    verifiedCount: allVerifiedSignals.length,
    missingCount: allMissingSignals.length
  };

  // 8. Assemble structured JSON matching requirements:
  //    { input, webEvidence, jobEvidence, newsEvidence, riskIndicators, verificationSignals }
  const finalResult = {
    input: normalized.userFacingInput,
    webEvidence: serpApiResult.webEvidence,
    jobEvidence: serpApiResult.jobEvidence,
    newsEvidence: serpApiResult.newsEvidence,
    riskIndicators: combinedIndicators,
    verificationSignals,
    summary: {
      assessment: assessmentSummary.assessment,
      headline: assessmentSummary.headline,
      indicatorCounts: assessmentSummary.indicatorCounts,
      disclaimer: assessmentSummary.disclaimer,
      recommendations: assessmentSummary.recommendations
    },
    metadata: {
      analyzedAt: new Date().toISOString(),
      executionDurationMs: durationMs,
      serpApiRequestsMade: serpApiResult.serpApiRequestsMade,
      rulesEvaluatedCount: engine.getRegisteredRuleIds().length
    },
    // Aliases to ensure backward-compatibility with existing tests & consumers
    userProvided: normalized.userFacingInput,
    warningIndicators: combinedIndicators,
    missingVerificationSignals: allMissingSignals
  };

  return finalResult;
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
