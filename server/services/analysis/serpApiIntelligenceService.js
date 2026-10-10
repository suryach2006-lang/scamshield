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
 * Non-corporate platforms, search engines, aggregators, social networks, and encyclopedias.
 * These domains are not accepted as official corporate domains unless the claimed entity itself
 * matches the platform (e.g. Google LLC -> google.com).
 */
const NON_CORPORATE_DOMAINS = new Set([
  'google.com',
  'google.co.in',
  'bing.com',
  'yahoo.com',
  'duckduckgo.com',
  'baidu.com',
  'yandex.com',
  'linkedin.com',
  'facebook.com',
  'twitter.com',
  'x.com',
  'instagram.com',
  'youtube.com',
  'reddit.com',
  'tiktok.com',
  'pinterest.com',
  'wikipedia.org',
  'wikimedia.org',
  'wikidata.org',
  'indeed.com',
  'indeed.co.in',
  'naukri.com',
  'glassdoor.com',
  'glassdoor.co.in',
  'ambitionbox.com',
  'monster.com',
  'foundit.in',
  'shine.com',
  'internshala.com',
  'unstop.com',
  'quora.com',
  'simplyhired.com',
  'ziprecruiter.com',
  'github.com',
  'gitlab.com',
  'medium.com',
  'wordpress.com',
  'blogspot.com'
]);

const CORPORATE_STOPWORDS = new Set([
  'inc', 'llc', 'ltd', 'limited', 'pvt', 'corp', 'corporation', 'co', 'company',
  'group', 'the', 'and', '&', 'private', 'services', 'technologies', 'solutions',
  'consulting', 'enterprises', 'global', 'international', 'systems', 'india',
  'official', 'careers', 'portal'
]);

/**
 * Normalizes a company name into core alphanumeric tokens.
 * @param {string} name
 * @returns {string[]}
 */
const extractCompanyTokens = (name) => {
  if (!name || typeof name !== 'string') return [];
  const words = name
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0);

  const meaningful = words.filter((w) => !CORPORATE_STOPWORDS.has(w));
  return meaningful.length > 0 ? meaningful : words;
};

/**
 * Validates whether an entity title from Knowledge Graph is plausibly associated with the claimed company.
 * @param {string} entityTitle
 * @param {string} companyName
 * @returns {boolean}
 */
const isEntityNamePlausible = (entityTitle, companyName) => {
  if (!entityTitle || !companyName) return false;
  const companyTokens = extractCompanyTokens(companyName);
  const entityTokens = extractCompanyTokens(entityTitle);
  if (companyTokens.length === 0 || entityTokens.length === 0) return false;

  return companyTokens.some((ct) =>
    entityTokens.some((et) => ct === et || ct.includes(et) || et.includes(ct))
  );
};

/**
 * Validates whether a candidate domain is plausibly associated with the claimed company.
 * Never accepts generic search-engine or aggregator domains unless the company is that specific entity.
 * Tightened so that a company-name substring alone cannot establish corporate authenticity.
 *
 * @param {string|null} candidateDomain - Candidate domain or URL
 * @param {string|null} companyName - Claimed company name
 * @param {string|null} [entityTitle=null] - Optional Google Knowledge Graph entity title
 * @returns {boolean}
 */
const verifyCandidateDomain = (candidateDomain, companyName, entityTitle = null) => {
  if (!candidateDomain || !companyName) return false;

  const domain = extractDomain(candidateDomain);
  if (!domain) return false;

  const domainLower = domain.toLowerCase();
  const domainParts = domainLower.split('.');
  const domainBase = domainParts[0];
  const domainClean = domainBase.replace(/[^a-z0-9]/g, '');

  const companyTokens = extractCompanyTokens(companyName);
  const entityTokens = entityTitle ? extractCompanyTokens(entityTitle) : [];
  const allTokens = [...new Set([...companyTokens, ...entityTokens])];

  if (allTokens.length === 0) return false;

  // Disallow search engine, social media, aggregator, or encyclopedia domains
  // unless the claimed company is explicitly that entity
  if (NON_CORPORATE_DOMAINS.has(domainLower)) {
    const isBrandSelf = allTokens.some((t) => t === domainClean);
    if (!isBrandSelf) {
      return false;
    }
  }

  // 1. Direct exact token match (tokens with length >= 3)
  // Tightened: must match the domain clean base exactly, not merely as a substring or hyphenated word
  for (const token of allTokens) {
    if (token.length >= 3 && domainClean === token) {
      return true;
    }
  }

  // 2. Acronym match using all words in company name or entity title (e.g. Tata Consultancy Services -> tcs)
  const extractAcronyms = (name) => {
    if (!name || typeof name !== 'string') return [];
    const words = name
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);
    if (words.length < 2) return [];

    const acronyms = [];
    acronyms.push(words.map((w) => w[0]).join(''));

    const meaningful = words.filter((w) => !CORPORATE_STOPWORDS.has(w));
    if (meaningful.length >= 2) {
      acronyms.push(meaningful.map((w) => w[0]).join(''));
    }

    return acronyms.filter((a) => a.length >= 2);
  };

  const candidateAcronyms = [
    ...extractAcronyms(companyName),
    ...(entityTitle ? extractAcronyms(entityTitle) : [])
  ];

  if (candidateAcronyms.some((acronym) => domainClean === acronym)) {
    return true;
  }

  // 3. Concatenated meaningful tokens exact match (e.g. Tech Mahindra -> techmahindra)
  if (companyTokens.length >= 2) {
    const concatenated = companyTokens.join('');
    if (concatenated.length >= 4 && domainClean === concatenated) {
      return true;
    }
  }

  const rawWords = String(companyName)
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  if (rawWords.length >= 2) {
    const rawConcatenated = rawWords.join('');
    if (rawConcatenated.length >= 4 && domainClean === rawConcatenated) {
      return true;
    }
  }

  if (entityTitle) {
    const entityWords = String(entityTitle)
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);
    if (entityWords.length >= 2) {
      const entityConcatenated = entityWords.join('');
      if (entityConcatenated.length >= 4 && domainClean === entityConcatenated) {
        return true;
      }
    }
  }

  return false;
};

/**
 * Safely escapes special regular expression characters in a string.
 * @param {string} str
 * @returns {string}
 */
const escapeRegExp = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Checks whether text specifically mentions or refers to the claimed company name,
 * avoiding accidental matching of generic corporate stopwords or substring collisions.
 *
 * @param {string} text - Text to inspect (e.g. title + snippet)
 * @param {string} companyName - Claimed employer name
 * @returns {boolean}
 */
const refersToCompany = (text, companyName) => {
  if (!text || !companyName || typeof text !== 'string' || typeof companyName !== 'string') {
    return false;
  }

  const trimmedCompany = companyName.trim();
  if (trimmedCompany.length < 2) return false;

  // 1. Direct whole-phrase match with word boundaries if length >= 3
  if (trimmedCompany.length >= 3) {
    const directRegex = new RegExp(`\\b${escapeRegExp(trimmedCompany)}\\b`, 'i');
    if (directRegex.test(text)) return true;
  }

  // 2. Meaningful tokens match (tokens without corporate stopwords like Ltd, Inc)
  const tokens = extractCompanyTokens(companyName);
  if (tokens.length === 0) return false;

  // Multi-word company: check combined meaningful phrase or concatenated form
  if (tokens.length >= 2) {
    const phrase = tokens.join(' ');
    if (new RegExp(`\\b${escapeRegExp(phrase)}\\b`, 'i').test(text)) {
      return true;
    }
    const concat = tokens.join('');
    if (concat.length >= 4 && new RegExp(`\\b${escapeRegExp(concat)}\\b`, 'i').test(text)) {
      return true;
    }
    // Check acronym if derived from >= 2 words and length >= 3 (e.g. TCS)
    const rawWords = String(companyName)
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);
    if (rawWords.length >= 2) {
      const acronym = rawWords.map((w) => w[0]).join('');
      if (acronym.length >= 3 && new RegExp(`\\b${escapeRegExp(acronym)}\\b`, 'i').test(text)) {
        return true;
      }
    }
  }

  // Single meaningful token: require word boundaries and length >= 3 (e.g. \bInfosys\b)
  const primaryToken = tokens[0];
  if (primaryToken && primaryToken.length >= 3) {
    const wordRegex = new RegExp(`\\b${escapeRegExp(primaryToken)}\\b`, 'i');
    if (wordRegex.test(text)) return true;
  }

  return false;
};

/**
 * Evaluates whether a news article title and snippet describe recruitment-related
 * fraud, fake job offers, recruitment fee scams, or employer impersonation.
 * Conservative classification: ignores unrelated corporate fraud, tax cases, or general criminal news.
 *
 * @param {Object} article - Normalized news article
 * @param {string} companyName - Claimed employer name
 * @returns {boolean}
 */
const isRecruitmentScamAlert = (article, companyName) => {
  if (!article || !companyName) return false;

  const title = article.title || '';
  const snippet = article.snippet || '';
  const fullText = `${title} ${snippet}`;

  // 1. Must specifically refer to the claimed company/employer
  if (!refersToCompany(fullText, companyName)) {
    return false;
  }

  // 2. Must describe explicit recruitment fraud, fake job offers, or employer impersonation
  const recruitmentFraudPatterns = [
    // Fake job offers, appointment letters, or interviews
    /\b(?:fake|fraudulent|bogus|counterfeit|forged|phony)\s+(?:jobs?|offer\s+letters?|appointment\s+letters?|employment|recruitment|interviews?|call\s+letters?)\b/i,
    /\b(?:job|offer|appointment)\s+(?:scams?|rackets?|frauds?|forgery)\b/i,

    // Recruitment / hiring / job racket, scam syndicate, or gang
    /\b(?:recruitment|hiring|employment|job|placement)\s+(?:rackets?|scams?|frauds?|syndicates?|rings?|gangs?)\b/i,

    // Impersonation of recruiters, HR, or the company for employment
    /\b(?:impersonat\w*|posing\s+as|pretending\s+to\s+be)\s+.*?(?:recruiters?|hr|talent|interviewers?|officials?|employers?)\b/i,
    /\b(?:impersonat\w*|posing\s+as|pretending\s+to\s+be)\s+.*?(?:jobs?|recruitment|hiring|offers?|employment)\b/i,
    /\b(?:scammers?|fraudsters?)\s+(?:impersonat\w*|pose\s+as|posing\s+as)\b/i,

    // Recruitment, registration, or interview fee demands
    /\b(?:recruitment|interview|registration|training|kit|application|placement)\s+fees?\b/i,
    /\b(?:demanded|demanding|charged|charging|collected|collecting|extorted)\s+.*?(?:money|fees?|cash)\s+.*?(?:for\s+(?:jobs?|offers?|employment)|promising\s+jobs?)\b/i,

    // Job seekers, candidates, or aspirants duped or cheated
    /\b(?:job\s*seekers?|candidates?|aspirants?|graduates?|unemployed)\s+(?:duped|cheated|scammed|defrauded|swindled|fleeced)\b/i,
    /\b(?:duped|cheated|scammed|defrauded)\s+.*?(?:promising\s+jobs?|with\s+fake\s+(?:jobs?|offers?|appointments?)|for\s+jobs?)\b/i,

    // Official employer warning / advisory regarding fake recruitment
    /\b(?:cautions?|warns?|alerted?|warning|advisory)\s+.*?(?:fake\s+jobs?|job\s+scams?|recruitment\s+fraud|recruitment\s+scams?|fake\s+offers?|fake\s+appointments?)\b/i,
    /\bnever\s+(?:charges?|demands?)\s+(?:any\s+)?(?:fees?|money)\s+(?:for\s+recruitment|for\s+employment|for\s+jobs?)\b/i
  ];

  // 3. Must establish a relevant contextual connection between the scam and the claimed company:
  // Either the title connects both, or at least one sentence/clause connects both
  const titleHasCompany = refersToCompany(title, companyName);
  const titleHasFraudPattern = recruitmentFraudPatterns.some((pattern) => pattern.test(title));
  if (titleHasCompany && titleHasFraudPattern) {
    return true;
  }

  const clauses = fullText
    .split(/[.!?\n;]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const clauseConnectsBoth = clauses.some((clause) => {
    return (
      refersToCompany(clause, companyName) &&
      recruitmentFraudPatterns.some((pattern) => pattern.test(clause))
    );
  });

  return clauseConnectsBoth;
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
  let verifiedSourceUrl = null;

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

      // Extract and verify official domain from knowledge graph or top organic results
      let officialDomain = null;
      const companyName = (normalizedInput.companyName || '').trim();

      // 1. Evaluate Knowledge Graph website candidate
      if (kg && kg.website && companyName) {
        const candidateKgDomain = extractDomain(kg.website);
        if (verifyCandidateDomain(candidateKgDomain, companyName, kg.title)) {
          officialDomain = candidateKgDomain;
          verifiedSourceUrl = kg.website;
        }
      }

      // 2. If Knowledge Graph did not establish a verified domain, evaluate top organic results
      if (!officialDomain && companyName && topResults.length > 0) {
        for (const result of topResults) {
          if (!result.link) continue;
          const candidateDomain = extractDomain(result.link);
          if (verifyCandidateDomain(candidateDomain, companyName)) {
            officialDomain = candidateDomain;
            verifiedSourceUrl = result.link;
            break;
          }
        }
      }

      baseResult.webEvidence.status = 'COMPLETED';
      baseResult.webEvidence.resultCount = topResults.length;
      baseResult.webEvidence.knowledgeGraph = kg;
      baseResult.webEvidence.officialDomain = officialDomain;
      baseResult.webEvidence.topResults = topResults;

      const isKgEntityValid = kg && kg.title && (!companyName || isEntityNamePlausible(kg.title, companyName));

      // Verification signal emission: keep verified corporate presence separate from general indexed search
      if (isKgEntityValid) {
        baseResult.verifiedSignals.push({
          signal: 'VERIFIED_KNOWLEDGE_GRAPH',
          category: 'COMPANY_IDENTITY',
          title: 'Verified Entity Knowledge Graph Found',
          description: `Google Knowledge Graph confirms "${kg.title}" as an established ${kg.type || 'organization'}.`,
          sourceUrl: kg.website || null
        });
      }

      if (officialDomain) {
        baseResult.verifiedSignals.push({
          signal: 'VERIFIED_CORPORATE_DOMAIN',
          category: 'COMPANY_IDENTITY',
          title: 'Verified Corporate Web Domain Found',
          description: `Web search confirmed authentic corporate domain "${officialDomain}" matching "${companyName || normalizedInput.jobTitle}".`,
          sourceUrl: verifiedSourceUrl || topResults[0]?.link || null
        });
      } else if (!isKgEntityValid && topResults.length > 0) {
        baseResult.verifiedSignals.push({
          signal: 'INDEXED_WEB_PRESENCE',
          category: 'COMPANY_IDENTITY',
          title: 'General Web Search Results Found',
          description: `Search returned indexed web results matching "${companyName || normalizedInput.jobTitle}", but official corporate domain verification remains inconclusive.`,
          sourceUrl: topResults[0].link
        });
      } else if (!isKgEntityValid && companyName && topResults.length === 0) {
        baseResult.missingSignals.push({
          signal: 'NO_INDEXED_COMPANY_WEB_PRESENCE',
          category: 'COMPANY_VERIFICATION',
          title: 'No Verified Web Presence Found in Search',
          description: `Web search for "${companyName}" yielded no verifiable official domain or knowledge graph. Note: Search absence alone does not prove fraud, but candidates should independently verify corporate registration.`,
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

      // Evaluate news articles conservatively for explicit recruitment fraud or employer impersonation
      const companyName = (normalizedInput.companyName || '').trim();
      const flagged = normalizedArticles.filter((article) =>
        isRecruitmentScamAlert(article, companyName)
      );

      baseResult.newsEvidence.status = 'COMPLETED';
      baseResult.newsEvidence.resultCount = normalizedArticles.length;
      baseResult.newsEvidence.articles = normalizedArticles;
      baseResult.newsEvidence.flaggedAlerts = flagged;
      baseResult.newsEvidence.alertsFound = flagged.length > 0;

      // When relevant reports of recruitment fraud or employer impersonation exist,
      // emit a contextual advisory rather than asserting that the user's specific listing is fraudulent.
      if (flagged.length > 0 && companyName) {
        const topAlert = flagged[0];
        baseResult.additionalIndicators.push({
          id: 'PUBLIC_NEWS_SCAM_REPORT',
          type: INDICATOR_TYPES.IDENTITY_VERIFICATION,
          severity: SEVERITY.LOW,
          title: 'Public Advisory: Recruitment Scam or Impersonation Reports',
          explanation:
            `Public news reports describe recruitment fraud or scammers impersonating "${companyName}" (such as fake offer letters or recruitment fees). This serves as a contextual advisory regarding known scam patterns; it does not establish that the submitted listing is fake or illegitimate. Independently verify offers via official employer channels.`,
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
  const companyName = (normalizedInput.companyName || '').trim();

  if (verifiedDomain && normalizedInput.recruiterContact.emailDetails.length > 0) {
    for (const emailObj of normalizedInput.recruiterContact.emailDetails) {
      if (!emailObj.isPublicWebmail) {
        const recruiterDomain = emailObj.domain.toLowerCase();
        const verifiedDomainLower = verifiedDomain.toLowerCase();

        // 1. Direct match or subdomain of the verified domain (e.g. 'careers.infosys.com' ends with '.infosys.com')
        const isExactOrSubdomain =
          recruiterDomain === verifiedDomainLower ||
          recruiterDomain.endsWith(`.${verifiedDomainLower}`);

        // 2. Alternative authentic corporate ccTLD or domain for this employer
        // (e.g. web search verified 'infosys.com' but recruiter uses 'infosys.co.in', which verifyCandidateDomain confirms)
        const isAuthenticCompanyDomain =
          Boolean(companyName && verifyCandidateDomain(recruiterDomain, companyName));

        // 3. Subdomain of an authentic corporate domain (e.g. 'careers.infosys.co.in' -> extractDomain is 'infosys.co.in')
        const recruiterPrimaryDomain = extractDomain(recruiterDomain);
        const isAuthenticPrimaryDomain =
          Boolean(recruiterPrimaryDomain && companyName && verifyCandidateDomain(recruiterPrimaryDomain, companyName));

        if (!isExactOrSubdomain && !isAuthenticCompanyDomain && !isAuthenticPrimaryDomain) {
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
              verifiedSourceUrl: verifiedSourceUrl || baseResult.webEvidence.topResults[0]?.link || null,
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
  extractDomain,
  verifyCandidateDomain,
  isRecruitmentScamAlert,
  refersToCompany
};
