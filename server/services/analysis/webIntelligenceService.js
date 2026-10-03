/**
 * Web Intelligence Verification Service
 * Gathers authentic web evidence regarding company identity, official web presence,
 * and public scam alerts via SerpApi without inventing or hallucinating data.
 */

const serpApiService = require('../serpApiService');
const logger = require('../../utils/logger');
const { SEVERITY, INDICATOR_TYPES } = require('./constants');

/**
 * Gathers authentic web evidence for a given company and listing context.
 *
 * @param {Object} normalizedInput
 * @param {Object} [options]
 * @param {boolean} [options.enabled=true] - Whether to perform live web queries
 * @returns {Promise<{ webEvidence: Object, additionalIndicators: Array, additionalMissingSignals: Array }>}
 */
const gatherWebIntelligence = async (normalizedInput, options = {}) => {
  const companyName = normalizedInput.companyName;
  const isEnabled = options.enabled !== false && Boolean(process.env.SERPAPI_KEY);

  const baseResult = {
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

  // If no company name or web search is disabled, return base
  if (!companyName || !isEnabled) {
    baseResult.webEvidence.status = !companyName ? 'NO_COMPANY_NAME' : 'SEARCH_DISABLED_OR_NO_KEY';
    return baseResult;
  }

  baseResult.webEvidence.searchPerformed = true;

  try {
    // 1. Check official company presence via Google search
    const companyQuery = `"${companyName}" official site`;
    baseResult.webEvidence.companyQuery = companyQuery;

    let companySearchResult = null;
    try {
      companySearchResult = await serpApiService.searchGoogle({
        q: companyQuery,
        num: 5
      });
    } catch (err) {
      logger.warn(`[WebIntelligence] Company presence query failed: ${err.message}`);
    }

    if (companySearchResult && companySearchResult.results) {
      const kg = companySearchResult.knowledgeGraph;
      const topLinks = (companySearchResult.results || []).slice(0, 3).map((r) => ({
        title: r.title,
        link: r.link,
        snippet: r.snippet,
        displayedLink: r.displayedLink
      }));

      const hasKnowledgeGraph = Boolean(kg && (kg.title || kg.website));
      const hasOrganicResults = topLinks.length > 0;

      baseResult.webEvidence.companyPresence = {
        queried: true,
        hasKnowledgeGraph,
        knowledgeGraph: kg || null,
        topResults: topLinks
      };

      // If zero results or knowledge graph found for a claimed enterprise
      if (!hasKnowledgeGraph && !hasOrganicResults) {
        baseResult.additionalMissingSignals.push({
          signal: 'NO_INDEXED_COMPANY_PRESENCE',
          category: 'COMPANY_VERIFICATION',
          description: `Web search for "${companyName}" yielded no verifiable official domain or knowledge graph.`,
          importance: 'HIGH'
        });
      }
    }

    // 2. Check for public scam/fraud reports
    const reputationQuery = `"${companyName}" (scam OR fraud OR fake OR complaints)`;
    baseResult.webEvidence.reputationQuery = reputationQuery;

    let reputationSearchResult = null;
    try {
      reputationSearchResult = await serpApiService.searchGoogle({
        q: reputationQuery,
        num: 5
      });
    } catch (err) {
      logger.warn(`[WebIntelligence] Reputation search query failed: ${err.message}`);
    }

    if (reputationSearchResult && reputationSearchResult.results) {
      const scamKeywords = /\b(?:scam|fraud|fake|complaint|cheated|caution|victim|fir)\b/i;

      const flaggedReports = (reputationSearchResult.results || [])
        .filter((item) => scamKeywords.test(item.title) || scamKeywords.test(item.snippet))
        .slice(0, 3)
        .map((item) => ({
          title: item.title,
          link: item.link,
          snippet: item.snippet,
          source: item.source || item.displayedLink
        }));

      baseResult.webEvidence.reputationAlerts = flaggedReports;

      if (flaggedReports.length > 0) {
        baseResult.additionalIndicators.push({
          id: 'PUBLIC_SCAM_REPORTS_FOUND',
          type: INDICATOR_TYPES.IDENTITY_VERIFICATION,
          severity: SEVERITY.HIGH,
          title: 'Public Scam Reports or Fraud Warnings Found Online',
          explanation:
            `Public search records show existing consumer complaints, scam advisories, or fraud discussions matching "${companyName}".`,
          evidence: {
            source: 'web_evidence.google_search',
            query: reputationQuery,
            topReportTitle: flaggedReports[0].title,
            topReportSnippet: flaggedReports[0].snippet,
            referenceUrl: flaggedReports[0].link
          }
        });
      }
    }

    baseResult.webEvidence.status = 'COMPLETED';
    return baseResult;
  } catch (err) {
    logger.error(`[WebIntelligence] Error during web intelligence analysis: ${err.message}`);
    baseResult.webEvidence.status = 'ERROR';
    baseResult.webEvidence.error = err.message;
    return baseResult;
  }
};

module.exports = {
  gatherWebIntelligence
};
