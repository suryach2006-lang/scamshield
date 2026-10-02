const { getJson } = require('serpapi');
const logger = require('../utils/logger');

/**
 * Validates and retrieves the SerpApi API key strictly from SERPAPI_KEY.
 * @returns {string} The validated SerpApi key.
 */
const getApiKey = () => {
  const apiKey = process.env.SERPAPI_KEY;

  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
    const error = new Error('SERPAPI_KEY is not configured in server environment variables.');
    error.statusCode = 500;
    error.code = 'MISSING_API_KEY';
    throw error;
  }

  return apiKey.trim();
};

/**
 * Generic search execution handler with timeout and error handling.
 * Safe logging ensures the API key is never printed or leaked.
 *
 * @param {string} engine - SerpApi search engine (e.g., 'google', 'google_jobs', 'google_news')
 * @param {Object} parameters - Search query parameters
 * @param {number} [timeoutMs=30000] - Search timeout in milliseconds
 * @returns {Promise<Object>} Raw SerpApi response
 */
const executeSearch = async (engine, parameters, timeoutMs = 30000) => {
  const apiKey = getApiKey();

  // Safe logging: Never log the API key or raw authorization headers
  logger.info(`[SerpApi] Initiating ${engine} query: "${parameters.q}"`);

  try {
    const searchParams = {
      ...parameters,
      engine,
      api_key: apiKey,
      timeout: timeoutMs
    };

    const response = await getJson(searchParams);

    if (!response) {
      const err = new Error('Empty response received from SerpApi.');
      err.statusCode = 502;
      err.code = 'SERPAPI_EMPTY_RESPONSE';
      throw err;
    }

    if (response.error) {
      const err = new Error(`SerpApi error: ${response.error}`);
      err.statusCode = 502;
      err.code = 'SERPAPI_API_ERROR';
      throw err;
    }

    return response;
  } catch (err) {
    // If it's already an error with a status code, rethrow
    if (err.statusCode) {
      throw err;
    }

    logger.error(`[SerpApi] Request failed for ${engine}: ${err.message}`);
    const wrappedError = new Error(err.message || 'Failed to complete search via SerpApi.');
    wrappedError.statusCode = 502;
    wrappedError.code = 'SERPAPI_REQUEST_FAILED';
    throw wrappedError;
  }
};

/**
 * Searches Google (Web Search) and returns normalized results.
 *
 * @param {Object} options
 * @param {string} options.q - Search query string
 * @param {string} [options.gl='in'] - Country code (default: 'in' for India)
 * @param {string} [options.hl='en'] - Language code (default: 'en')
 * @param {number} [options.num=10] - Number of search results
 * @param {number} [options.page=1] - Results page number
 * @returns {Promise<Object>} Normalized web search results
 */
const searchGoogle = async ({ q, gl = 'in', hl = 'en', num = 10, page = 1 }) => {
  const params = {
    q,
    gl,
    hl,
    num: Math.min(Math.max(Number(num) || 10, 1), 100),
    start: ((Number(page) || 1) - 1) * (Number(num) || 10)
  };

  const raw = await executeSearch('google', params);

  const organicResults = (raw.organic_results || []).map((item, index) => ({
    position: item.position || index + 1,
    title: item.title || '',
    link: item.link || '',
    snippet: item.snippet || '',
    displayedLink: item.displayed_link || '',
    source: item.source || null,
    date: item.date || null,
    sitelinks: item.sitelinks?.inline?.map((s) => ({ title: s.title, link: s.link })) ||
      item.sitelinks?.expanded?.map((s) => ({ title: s.title, link: s.link })) || []
  }));

  const knowledgeGraph = raw.knowledge_graph ? {
    title: raw.knowledge_graph.title || null,
    type: raw.knowledge_graph.type || null,
    description: raw.knowledge_graph.description || null,
    website: raw.knowledge_graph.website || null
  } : null;

  const relatedSearches = (raw.related_searches || []).map((r) => r.query).filter(Boolean);

  return {
    engine: 'google',
    query: q,
    country: gl,
    language: hl,
    totalResults: raw.search_information?.total_results || null,
    timeTakenSeconds: raw.search_information?.time_taken_displayed || null,
    resultCount: organicResults.length,
    results: organicResults,
    knowledgeGraph,
    relatedSearches
  };
};

/**
 * Searches Google Jobs and returns normalized job listings.
 *
 * @param {Object} options
 * @param {string} options.q - Job query
 * @param {string} [options.location] - Job location
 * @param {string} [options.gl='in'] - Country code
 * @param {string} [options.hl='en'] - Language code
 * @returns {Promise<Object>} Normalized jobs search results
 */
const searchJobs = async ({ q, location, gl = 'in', hl = 'en' }) => {
  const params = {
    q,
    gl,
    hl
  };

  if (location && typeof location === 'string' && location.trim() !== '') {
    params.location = location.trim();
  }

  const raw = await executeSearch('google_jobs', params);

  const jobs = (raw.jobs_results || []).map((job, index) => ({
    id: job.job_id || String(index + 1),
    title: job.title || '',
    companyName: job.company_name || '',
    location: job.location || '',
    description: job.description || '',
    via: job.via || '',
    thumbnail: job.thumbnail || null,
    detectedExtensions: job.detected_extensions || {},
    extensions: job.extensions || [],
    applyOptions: (job.apply_options || []).map((opt) => ({
      title: opt.title || 'Apply',
      link: opt.link || ''
    }))
  }));

  return {
    engine: 'google_jobs',
    query: q,
    location: params.location || null,
    country: gl,
    language: hl,
    resultCount: jobs.length,
    jobs
  };
};

/**
 * Searches Google News and returns normalized news articles.
 *
 * @param {Object} options
 * @param {string} options.q - News query
 * @param {string} [options.gl='in'] - Country code
 * @param {string} [options.hl='en'] - Language code
 * @returns {Promise<Object>} Normalized news search results
 */
const searchNews = async ({ q, gl = 'in', hl = 'en' }) => {
  const params = {
    q,
    gl,
    hl
  };

  const raw = await executeSearch('google_news', params);

  const news = (raw.news_results || []).map((item, index) => ({
    position: item.position || index + 1,
    title: item.title || '',
    link: item.link || '',
    snippet: item.snippet || '',
    source: item.source?.name || (typeof item.source === 'string' ? item.source : ''),
    date: item.date || '',
    thumbnail: item.thumbnail || null,
    stories: (item.stories || []).map((story) => ({
      title: story.title || '',
      link: story.link || '',
      source: story.source?.name || (typeof story.source === 'string' ? story.source : ''),
      date: story.date || ''
    }))
  }));

  return {
    engine: 'google_news',
    query: q,
    country: gl,
    language: hl,
    resultCount: news.length,
    news
  };
};

module.exports = {
  searchGoogle,
  searchJobs,
  searchNews
};
