/**
 * SerpApi Intelligence Service for ScamShield Analysis Engine
 * Connects the analysis pipeline with Google Web, Google Jobs, and Google News
 * through sensible, budget-conscious query construction without fabricating evidence.
 */

const serpApiService = require('../serpApiService');
const logger = require('../../utils/logger');
const { SEVERITY, INDICATOR_TYPES } = require('./constants');

/**
 * Constructs targeted search queries for each search engine.
 * Avoids blindly querying the raw text dump.
 *
 * @param {Object} input - Normalized listing input
 * @returns {{ webQuery: string|null, jobsQuery: Object|null, newsQuery: string|null }}
 */
const buildQueries = (input) => {
  const company = (input.companyName || '').trim();
  const title = (input.jobTitle || '').trim();
  const location = (input.location || '').trim();
  const domain = (input.urlDetails?.domain || '').trim();

  // 1. Web Query Construction
  let webQuery = null;
  if (company) {
    webQuery = `"${company}" official site OR careers`;
  } else if (title) {
    webQuery = `"${title}" recruitment hiring ${location}`.trim();
  } else if (domain) {
    webQuery = `"${domain}" official careers`;
  }

  // 2. Google Jobs Query Construction
  let jobsQuery = null;
  if (title && company) {
    jobsQuery = {
      q: `${title} ${company}`.trim(),
      location: location || undefined
    };
  } else if (title) {
    jobsQuery = {
      q: title,
      location: location || undefined
    };
  } else if (company) {
    jobsQuery = {
      q: company,
      location: location || undefined
    };
  }

  // 3. Google News Query Construction (Checks for recruitment scam / fraud alerts)
  let newsQuery = null;
  if (company) {
    newsQuery = `"${company}" (scam OR fraud OR fake OR fake offer OR arrest)`;
  } else if (title) {
    newsQuery = `"${title}" (job scam OR recruitment fraud OR police)`;
  }

  return {
    webQuery,
    jobsQuery,
    newsQuery
  };
};

/**
 * Extracts the primary domain from a URL, respecting two-part ccTLDs (.co.in, .co.uk, etc.).
 * @param {string} urlString
 * @returns {string|null}
 */
const extractDomain = (urlString) => {
  if (!urlString) return null;
  try {
    const formatted = /^https?:\/\//i.test(urlString) ? urlString : `https://${urlString}`;
    const parsed = new URL(formatted);
    const parts = parsed.hostname.toLowerCase().split('.');
    if (parts.length <= 1) return parsed.hostname;

    // Support two-part ccTLDs like .co.in, .co.uk, .com.au, .org.in
    const secondLast = parts[parts.length - 2];
    const twoPartPrefixes = new Set(['co', 'com', 'org', 'net', 'edu', 'gov', 'ac']);
    if (parts.length >= 3 && twoPartPrefixes.has(secondLast) && parts[parts.length - 1].length === 2) {
      return parts.slice(-3).join('.');
    }

    return parts.slice(-2).join('.');
  } catch {
    return null;
  }
};

/**
 * Gathers and normalizes SerpApi evidence across Web, Google Jobs, and Google News.
 * Strictly limits requests to at most 3 targeted searches per analysis.
 *
 * @param {Object} normalizedInput
 * @param {Object} [options]
 * @param {boolean} [options.enabled=true] - Whether to perform live SerpApi queries
 * @returns {Promise<{
 *   webEvidence: Object,
 *   jobEvidence: Object,
 *   newsEvidence: Object,
 *   additionalIndicators: Array,
 *   verifiedSignals: Array,
 *   missingSignals: Array,
 *   serpApiRequestsMade: number
 * }>}
 */
const gatherSerpApiEvidence = async (normalizedInput, options = {}) => {
  const isEnabled = options.enabled !== false && Boolean(process.env.SERPAPI_KEY);

  const baseResult = {
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

  if (!isEnabled) {
    baseResult.webEvidence.status = 'SEARCH_DISABLED_OR_NO_KEY';
    baseResult.jobEvidence.status = 'SEARCH_DISABLED_OR_NO_KEY';
    baseResult.newsEvidence.status = 'SEARCH_DISABLED_OR_NO_KEY';
    return baseResult;
  }

  const { webQuery, jobsQuery, newsQuery } = buildQueries(normalizedInput);
  let requestsCount = 0;

  // --- 1. Web Search Execution ---
  if (webQuery) {
    requestsCount += 1;
    baseResult.webEvidence.searchPerformed = true;
    baseResult.webEvidence.query = webQuery;

    try {
      const rawWeb = await serpApiService.searchGoogle({
        q: webQuery,
        num: 5
      });

      const kg = rawWeb.knowledgeGraph
        ? {
            title: rawWeb.knowledgeGraph.title || null,
            type: rawWeb.knowledgeGraph.type || null,
            description: rawWeb.knowledgeGraph.description || null,
            website: rawWeb.knowledgeGraph.website || null
          }
        : null;

      const topResults = (rawWeb.results || []).slice(0, 5).map((r) => ({
        title: r.title || '',
        link: r.link || '',
        snippet: r.snippet || '',
        displayedLink: r.displayedLink || ''
      }));

      // Extract official domain from knowledge graph or top organic result
      let officialDomain = null;
      if (kg && kg.website) {
        officialDomain = extractDomain(kg.website);
      } else if (topResults.length > 0 && topResults[0].link) {
        officialDomain = extractDomain(topResults[0].link);
      }

      baseResult.webEvidence.status = 'COMPLETED';
      baseResult.webEvidence.resultCount = topResults.length;
      baseResult.webEvidence.knowledgeGraph = kg;
      baseResult.webEvidence.officialDomain = officialDomain;
      baseResult.webEvidence.topResults = topResults;

      // Verification signal: verified web presence
      if (kg && kg.title) {
        baseResult.verifiedSignals.push({
          signal: 'VERIFIED_KNOWLEDGE_GRAPH',
          category: 'COMPANY_IDENTITY',
          title: 'Verified Entity Knowledge Graph Found',
          description: `Google Knowledge Graph confirms "${kg.title}" as an established ${kg.type || 'organization'}.`,
          sourceUrl: kg.website || null
        });
      } else if (topResults.length > 0) {
        baseResult.verifiedSignals.push({
          signal: 'INDEXED_CORPORATE_PORTAL',
          category: 'COMPANY_IDENTITY',
          title: 'Indexed Corporate Web Presence Found',
          description: `Search returned indexed web presences matching "${normalizedInput.companyName || normalizedInput.jobTitle}".`,
          sourceUrl: topResults[0].link
        });
      } else if (normalizedInput.companyName) {
        baseResult.missingSignals.push({
          signal: 'NO_INDEXED_COMPANY_WEB_PRESENCE',
          category: 'COMPANY_VERIFICATION',
          title: 'No Verified Web Presence Found in Search',
          description: `Web search for "${normalizedInput.companyName}" yielded no verifiable official domain or knowledge graph. Note: Search absence alone does not prove fraud, but candidates should independently verify corporate registration.`,
          importance: 'HIGH'
        });
      }
    } catch (err) {
      logger.error(`[SerpApiIntelligence] Web search failed: ${err.message}`);
      baseResult.webEvidence.status = 'ERROR';
      baseResult.webEvidence.error = 'Search query could not be completed.';
    }
  } else {
    baseResult.webEvidence.status = 'NO_QUERY';
  }

  // --- 2. Google Jobs Search Execution ---
  if (jobsQuery) {
    requestsCount += 1;
    baseResult.jobEvidence.searchPerformed = true;
    baseResult.jobEvidence.query = jobsQuery.q;
    baseResult.jobEvidence.location = jobsQuery.location || null;

    try {
      const rawJobs = await serpApiService.searchJobs({
        q: jobsQuery.q,
        location: jobsQuery.location
      });

      const normalizedListings = (rawJobs.jobs || []).slice(0, 5).map((job) => ({
        id: job.id,
        title: job.title,
        companyName: job.companyName,
        location: job.location,
        via: job.via,
        applyOptions: (job.applyOptions || []).slice(0, 2),
        extensions: (job.extensions || []).slice(0, 3)
      }));

      baseResult.jobEvidence.status = 'COMPLETED';
      baseResult.jobEvidence.resultCount = normalizedListings.length;
      baseResult.jobEvidence.matchedListingsCount = normalizedListings.length;
      baseResult.jobEvidence.listings = normalizedListings;

      if (normalizedListings.length > 0) {
        baseResult.jobEvidence.corroborationStatus = 'MATCHING_LISTINGS_FOUND';
        baseResult.verifiedSignals.push({
          signal: 'ACTIVE_JOB_LISTINGS_INDEXED',
          category: 'JOB_CORROBORATION',
          title: 'Active Openings Indexed on Google Jobs',
          description: `Google Jobs verified active job listings for this query through platforms like ${normalizedListings[0].via || 'job portals'}.`,
          sampleLink: normalizedListings[0].applyOptions[0]?.link || null
        });
      } else {
        baseResult.jobEvidence.corroborationStatus = 'NO_MATCHING_LISTINGS_FOUND';
        if (normalizedInput.companyName && normalizedInput.jobTitle) {
          baseResult.missingSignals.push({
            signal: 'UNLISTED_ON_GOOGLE_JOBS',
            category: 'JOB_CORROBORATION',
            title: 'No Matching Listings in Google Jobs',
            description: `No active job postings for "${normalizedInput.jobTitle}" at "${normalizedInput.companyName}" were indexed in Google Jobs. While not all private openings are syndicated, verifying directly with HR is recommended.`,
            importance: 'MEDIUM'
          });
        }
      }
    } catch (err) {
      logger.error(`[SerpApiIntelligence] Jobs search failed: ${err.message}`);
      baseResult.jobEvidence.status = 'ERROR';
      baseResult.jobEvidence.error = 'Jobs search could not be completed.';
    }
  } else {
    baseResult.jobEvidence.status = 'NO_QUERY';
  }

  // --- 3. Google News Search Execution ---
  if (newsQuery) {
    requestsCount += 1;
    baseResult.newsEvidence.searchPerformed = true;
    baseResult.newsEvidence.query = newsQuery;

    try {
      const rawNews = await serpApiService.searchNews({
        q: newsQuery
      });

      const normalizedArticles = (rawNews.news || []).slice(0, 5).map((article) => ({
        title: article.title,
        link: article.link,
        source: article.source,
        date: article.date,
        snippet: article.snippet
      }));

      // Filter for articles that explicitly contain fraud/scam warning terms
      const scamFilter = /\b(?:scam|fraud|fake\s+job|fake\s+offer|arrested|duped|racket|cybercrime|cheated|caution)\b/i;
      const flagged = normalizedArticles.filter(
        (a) => scamFilter.test(a.title) || scamFilter.test(a.snippet)
      );

      baseResult.newsEvidence.status = 'COMPLETED';
      baseResult.newsEvidence.resultCount = normalizedArticles.length;
      baseResult.newsEvidence.articles = normalizedArticles;
      baseResult.newsEvidence.flaggedAlerts = flagged;
      baseResult.newsEvidence.alertsFound = flagged.length > 0;

      // If legitimate news reports of recruitment fraud or impersonation exist
      if (flagged.length > 0 && normalizedInput.companyName) {
        const topAlert = flagged[0];
        baseResult.additionalIndicators.push({
          id: 'PUBLIC_NEWS_SCAM_REPORT',
          type: INDICATOR_TYPES.IDENTITY_VERIFICATION,
          severity: SEVERITY.HIGH,
          title: 'Public News Reports of Recruitment Fraud or Impersonation',
          explanation:
            `Verified news publications have reported recruitment fraud, fake appointment letters, or impersonation schemes referencing "${normalizedInput.companyName}".`,
          evidence: {
            source: 'serpapi.google_news',
            query: newsQuery,
            articleTitle: topAlert.title,
            publisher: topAlert.source,
            sourceUrl: topAlert.link,
            snippet: topAlert.snippet
          }
        });
      }
    } catch (err) {
      logger.error(`[SerpApiIntelligence] News search failed: ${err.message}`);
      baseResult.newsEvidence.status = 'ERROR';
      baseResult.newsEvidence.error = 'News search could not be completed.';
    }
  } else {
    baseResult.newsEvidence.status = 'NO_QUERY';
  }

  // --- 4. Cross-Verification: Verified Web Domain vs Provided Recruiter Domain ---
  const verifiedDomain = baseResult.webEvidence.officialDomain;
  if (verifiedDomain && normalizedInput.recruiterContact.emailDetails.length > 0) {
    for (const emailObj of normalizedInput.recruiterContact.emailDetails) {
      if (!emailObj.isPublicWebmail) {
        const recruiterDomain = emailObj.domain.toLowerCase();
        if (recruiterDomain !== verifiedDomain.toLowerCase() && !recruiterDomain.endsWith(`.${verifiedDomain.toLowerCase()}`)) {
          baseResult.additionalIndicators.push({
            id: 'VERIFIED_DOMAIN_MISMATCH',
            type: INDICATOR_TYPES.DOMAIN_MISMATCH,
            severity: SEVERITY.HIGH,
            title: 'Recruiter Domain Mismatches Verified Corporate Domain',
            explanation:
              `Web search verified the authentic corporate domain as "${verifiedDomain}", but the recruiter contact provided a mismatched domain "${recruiterDomain}".`,
            evidence: {
              source: 'web_search_cross_reference',
              verifiedCorporateDomain: verifiedDomain,
              verifiedSourceUrl: baseResult.webEvidence.topResults[0]?.link || null,
              recruiterEmail: emailObj.email,
              recruiterDomain
            }
          });
        }
      }
    }
  }

  baseResult.serpApiRequestsMade = requestsCount;
  return baseResult;
};

module.exports = {
  gatherSerpApiEvidence,
  buildQueries,
  extractDomain
};
