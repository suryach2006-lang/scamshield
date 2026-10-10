/**
 * Unit Tests for SerpApi Intelligence Query Construction and Normalization
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');

const {
  buildQueries,
  extractDomain,
  gatherSerpApiEvidence,
  verifyCandidateDomain,
  isRecruitmentScamAlert,
  refersToCompany
} = require('../services/analysis/serpApiIntelligenceService');
const { normalizeInput } = require('../services/analysis/normalizer');
const serpApiService = require('../services/serpApiService');

describe('SerpApi Intelligence Query Construction', () => {
  it('should construct sensible queries when both company and title are provided', () => {
    const input = normalizeInput({
      companyName: 'Infosys Limited',
      jobTitle: 'Senior React Developer',
      location: 'Bangalore, India'
    });

    const queries = buildQueries(input);

    assert.ok(queries.webQuery.includes('Infosys Limited'));
    assert.ok(queries.webQuery.includes('official site OR careers'));
    assert.equal(queries.jobsQuery.q, 'Senior React Developer Infosys Limited');
    assert.equal(queries.jobsQuery.location, 'Bangalore, India');
    assert.ok(queries.newsQuery.includes('Infosys Limited'));
    assert.ok(queries.newsQuery.includes('scam OR fraud'));
  });

  it('should handle title-only input without hallucinating company queries', () => {
    const input = normalizeInput({
      jobTitle: 'Data Entry Clerk',
      location: 'Remote'
    });

    const queries = buildQueries(input);

    assert.ok(queries.webQuery.includes('Data Entry Clerk'));
    assert.equal(queries.jobsQuery.q, 'Data Entry Clerk');
    assert.ok(queries.newsQuery.includes('Data Entry Clerk'));
  });

  it('should extract domains cleanly from standard and nested URLs', () => {
    assert.equal(extractDomain('https://careers.google.com/jobs/results'), 'google.com');
    assert.equal(extractDomain('http://sub.domain.tcs.com/apply'), 'tcs.com');
    assert.equal(extractDomain('https://wipro.co.in/careers'), 'wipro.co.in');
    assert.equal(extractDomain('microsoft.com'), 'microsoft.com');
    assert.equal(extractDomain('invalid-url-string'), 'invalid-url-string');
    assert.equal(extractDomain(''), null);
  });

  it('should skip searches gracefully when disabled or key missing', async () => {
    const input = normalizeInput({
      companyName: 'Test Corp',
      jobTitle: 'Tester'
    });

    const result = await gatherSerpApiEvidence(input, { enabled: false });

    assert.equal(result.webEvidence.searchPerformed, false);
    assert.equal(result.jobEvidence.searchPerformed, false);
    assert.equal(result.newsEvidence.searchPerformed, false);
    assert.equal(result.serpApiRequestsMade, 0);
  });
});

describe('Corporate Domain Verification & Recruiter Mismatch Regression', () => {
  let originalSearchGoogle;
  let originalSearchJobs;
  let originalSearchNews;
  let originalApiKey;

  beforeEach(() => {
    originalSearchGoogle = serpApiService.searchGoogle;
    originalSearchJobs = serpApiService.searchJobs;
    originalSearchNews = serpApiService.searchNews;
    originalApiKey = process.env.SERPAPI_KEY;
    process.env.SERPAPI_KEY = 'test_mock_serpapi_key';

    serpApiService.searchJobs = async () => ({ jobs: [] });
    serpApiService.searchNews = async () => ({ news: [] });
  });

  afterEach(() => {
    serpApiService.searchGoogle = originalSearchGoogle;
    serpApiService.searchJobs = originalSearchJobs;
    serpApiService.searchNews = originalSearchNews;
    if (originalApiKey !== undefined) {
      process.env.SERPAPI_KEY = originalApiKey;
    } else {
      delete process.env.SERPAPI_KEY;
    }
  });

  it('should directly validate candidate domains with verifyCandidateDomain helper', () => {
    // Search engine / aggregators should be rejected for Infosys
    assert.equal(verifyCandidateDomain('google.com', 'Infosys Limited'), false);
    assert.equal(verifyCandidateDomain('https://www.google.com/search?q=infosys', 'Infosys Limited'), false);
    assert.equal(verifyCandidateDomain('https://en.wikipedia.org/wiki/Infosys', 'Infosys Limited'), false);
    assert.equal(verifyCandidateDomain('https://www.naukri.com/infosys-jobs', 'Infosys Limited'), false);
    assert.equal(verifyCandidateDomain('https://www.linkedin.com/company/infosys', 'Infosys Limited'), false);

    // Lookalike and deceptive domains must not be treated as verified official domains for Infosys
    assert.equal(verifyCandidateDomain('infosys-careers-fraud.com', 'Infosys Limited'), false);
    assert.equal(verifyCandidateDomain('infosys.com.fake-domain.net', 'Infosys Limited'), false);
    assert.equal(verifyCandidateDomain('notinfosys.com', 'Infosys Limited'), false);
    assert.equal(verifyCandidateDomain('infosys-careers-fraud.com', 'Infosys'), false);
    assert.equal(verifyCandidateDomain('infosys.com.fake-domain.net', 'Infosys'), false);
    assert.equal(verifyCandidateDomain('notinfosys.com', 'Infosys'), false);

    // Legitimate matching domains should be accepted
    assert.equal(verifyCandidateDomain('https://www.infosys.com', 'Infosys Limited'), true);
    assert.equal(verifyCandidateDomain('https://careers.infosys.com', 'Infosys Limited'), true);
    assert.equal(verifyCandidateDomain('infosys.co.in', 'Infosys Limited'), true);
    assert.equal(verifyCandidateDomain('https://www.tcs.com', 'Tata Consultancy Services'), true);

    // Null and empty checks
    assert.equal(verifyCandidateDomain(null, 'Infosys'), false);
    assert.equal(verifyCandidateDomain('infosys.com', null), false);
    assert.equal(verifyCandidateDomain('', ''), false);
  });

  it('should reject lookalike domains in web search and not treat them as verified official domains', async () => {
    serpApiService.searchGoogle = async () => ({
      results: [
        {
          title: 'Infosys Careers Fraud Portal',
          link: 'https://infosys-careers-fraud.com/apply',
          snippet: 'Fraudulent portal using company name in hyphenated domain'
        },
        {
          title: 'Fake Infosys Subdomain',
          link: 'https://infosys.com.fake-domain.net/jobs',
          snippet: 'Attacker site hosting jobs under fake-domain.net'
        },
        {
          title: 'Not Infosys Portal',
          link: 'https://notinfosys.com',
          snippet: 'Lookalike domain using company name as substring suffix'
        }
      ],
      knowledgeGraph: null
    });

    const input = normalizeInput({
      companyName: 'Infosys Limited',
      jobTitle: 'Software Engineer',
      recruiterContact: 'recruiter@infosys.com'
    });

    const result = await gatherSerpApiEvidence(input, { enabled: true });

    assert.equal(result.webEvidence.officialDomain, null);
    assert.equal(result.verifiedSignals.some((s) => s.signal === 'VERIFIED_CORPORATE_DOMAIN'), false);
  });

  it('should not automatically accept google.com as official domain for Infosys even when ranking first', async () => {
    serpApiService.searchGoogle = async () => ({
      results: [
        {
          title: 'Infosys - Google Search',
          link: 'https://www.google.com/search?q=infosys',
          snippet: 'Search results for Infosys on Google'
        },
        {
          title: 'Infosys - Wikipedia',
          link: 'https://en.wikipedia.org/wiki/Infosys',
          snippet: 'Infosys Limited is an Indian multinational IT company...'
        }
      ],
      knowledgeGraph: null
    });

    const input = normalizeInput({
      companyName: 'Infosys Limited',
      jobTitle: 'Senior Systems Engineer',
      recruiterContact: 'recruiter@infosys.com'
    });

    const result = await gatherSerpApiEvidence(input, { enabled: true });

    // Official domain must be null, never google.com
    assert.equal(result.webEvidence.officialDomain, null);
    assert.equal(result.webEvidence.searchPerformed, true);

    // Must not emit verified corporate domain signal when unverified
    assert.equal(result.verifiedSignals.some((s) => s.signal === 'VERIFIED_CORPORATE_DOMAIN'), false);

    // General web presence signal emitted instead
    assert.equal(result.verifiedSignals.some((s) => s.signal === 'INDEXED_WEB_PRESENCE'), true);

    // Must not flag recruiter-domain mismatch with google.com
    assert.equal(result.additionalIndicators.some((i) => i.id === 'VERIFIED_DOMAIN_MISMATCH'), false);
  });

  it('should not flag recruiter-domain mismatch when corporate domain is unverified', async () => {
    serpApiService.searchGoogle = async () => ({
      results: [
        {
          title: 'Jobs at Infosys - Naukri',
          link: 'https://www.naukri.com/infosys-jobs',
          snippet: 'Find open roles at Infosys on job portal'
        }
      ],
      knowledgeGraph: null
    });

    const input = normalizeInput({
      companyName: 'Infosys Limited',
      jobTitle: 'Software Engineer',
      recruiterContact: 'hr@some-unrelated-domain.com'
    });

    const result = await gatherSerpApiEvidence(input, { enabled: true });

    assert.equal(result.webEvidence.officialDomain, null);
    // Unverified corporate domain must not generate VERIFIED_DOMAIN_MISMATCH
    assert.equal(result.additionalIndicators.some((i) => i.id === 'VERIFIED_DOMAIN_MISMATCH'), false);
  });

  it('should use a genuinely verified official domain to detect recruiter domain mismatch', async () => {
    serpApiService.searchGoogle = async () => ({
      results: [
        {
          title: 'Infosys - Consulting | IT Services',
          link: 'https://www.infosys.com',
          snippet: 'Infosys is a global leader in next-generation digital services'
        }
      ],
      knowledgeGraph: {
        title: 'Infosys',
        type: 'Information technology company',
        website: 'https://www.infosys.com'
      }
    });

    // Mismatched recruiter email
    const inputMismatch = normalizeInput({
      companyName: 'Infosys Limited',
      jobTitle: 'Software Engineer',
      recruiterContact: 'hr-recruiting@fraudulent-portal.com'
    });

    const resultMismatch = await gatherSerpApiEvidence(inputMismatch, { enabled: true });

    assert.equal(resultMismatch.webEvidence.officialDomain, 'infosys.com');
    const mismatchIndicator = resultMismatch.additionalIndicators.find((i) => i.id === 'VERIFIED_DOMAIN_MISMATCH');
    assert.ok(mismatchIndicator, 'Expected VERIFIED_DOMAIN_MISMATCH to be generated for fraudulent recruiter domain');
    assert.equal(mismatchIndicator.evidence.verifiedCorporateDomain, 'infosys.com');
    assert.equal(mismatchIndicator.evidence.recruiterDomain, 'fraudulent-portal.com');

    // Authentic matching recruiter email
    const inputMatch = normalizeInput({
      companyName: 'Infosys Limited',
      jobTitle: 'Software Engineer',
      recruiterContact: 'careers@infosys.com'
    });

    const resultMatch = await gatherSerpApiEvidence(inputMatch, { enabled: true });
    assert.equal(resultMatch.webEvidence.officialDomain, 'infosys.com');
    assert.equal(resultMatch.additionalIndicators.some((i) => i.id === 'VERIFIED_DOMAIN_MISMATCH'), false);
  });

  it('should reject non-associated Knowledge Graph website candidates', async () => {
    serpApiService.searchGoogle = async () => ({
      results: [],
      knowledgeGraph: {
        title: 'Infosys',
        type: 'Organization',
        website: 'https://www.google.com/search'
      }
    });

    const input = normalizeInput({
      companyName: 'Infosys Limited',
      jobTitle: 'Software Engineer',
      recruiterContact: 'recruiter@infosys.com'
    });

    const result = await gatherSerpApiEvidence(input, { enabled: true });

    // google.com in Knowledge Graph should be rejected
    assert.equal(result.webEvidence.officialDomain, null);
    assert.equal(result.additionalIndicators.some((i) => i.id === 'VERIFIED_DOMAIN_MISMATCH'), false);
  });
});

describe('Google News Intelligence & False-Positive Prevention', () => {
  let originalSearchGoogle;
  let originalSearchJobs;
  let originalSearchNews;
  let originalApiKey;

  beforeEach(() => {
    originalSearchGoogle = serpApiService.searchGoogle;
    originalSearchJobs = serpApiService.searchJobs;
    originalSearchNews = serpApiService.searchNews;
    originalApiKey = process.env.SERPAPI_KEY;
    process.env.SERPAPI_KEY = 'test_mock_serpapi_key';

    serpApiService.searchGoogle = async () => ({ results: [], knowledgeGraph: null });
    serpApiService.searchJobs = async () => ({ jobs: [] });
  });

  afterEach(() => {
    serpApiService.searchGoogle = originalSearchGoogle;
    serpApiService.searchJobs = originalSearchJobs;
    serpApiService.searchNews = originalSearchNews;
    if (originalApiKey !== undefined) {
      process.env.SERPAPI_KEY = originalApiKey;
    } else {
      delete process.env.SERPAPI_KEY;
    }
  });

  it('should not automatically create a HIGH-severity listing-specific indicator for articles about scammers impersonating the company', async () => {
    serpApiService.searchNews = async () => ({
      news: [
        {
          title: 'Scammers Impersonating Infosys in Phishing Campaign',
          snippet: 'Cyber security advisory alerts job applicants that fraudsters are impersonating Infosys recruiters on Telegram to solicit personal data.',
          source: 'Cyber Threat Digest',
          link: 'https://news.example.com/impersonation-advisory'
        }
      ]
    });

    const input = normalizeInput({
      companyName: 'Infosys Limited',
      jobTitle: 'Senior Systems Engineer'
    });

    const result = await gatherSerpApiEvidence(input, { enabled: true });

    // Articles should be preserved in newsEvidence
    assert.equal(result.newsEvidence.articles.length, 1);

    // Must NOT create a HIGH-severity indicator
    const highIndicators = result.additionalIndicators.filter((i) => i.severity === 'HIGH');
    assert.equal(highIndicators.length, 0, 'Must not produce any HIGH-severity listing-specific indicators');

    // If an advisory indicator is emitted, it must be LOW severity and provide contextual guidance
    const newsIndicator = result.additionalIndicators.find((i) => i.id === 'PUBLIC_NEWS_SCAM_REPORT');
    if (newsIndicator) {
      assert.equal(newsIndicator.severity, 'LOW');
      assert.equal(/is fraudulent/i.test(newsIndicator.explanation), false);
      assert.equal(/verified news publications/i.test(newsIndicator.explanation), false);
    }
  });

  it('should not create a recruitment-scam indicator for an unrelated corporate fraud case', async () => {
    serpApiService.searchNews = async () => ({
      news: [
        {
          title: 'Infosys GST billing fraud under investigation by tax department',
          snippet: 'Authorities are probing alleged supplier invoice irregularities and tax credit fraud of ₹100 crore involving third-party vendors.',
          source: 'National Business Review',
          link: 'https://news.example.com/gst-probe'
        }
      ]
    });

    const input = normalizeInput({
      companyName: 'Infosys Limited',
      jobTitle: 'Software Engineer'
    });

    const result = await gatherSerpApiEvidence(input, { enabled: true });

    // Article is retained as contextual news
    assert.equal(result.newsEvidence.articles.length, 1);

    // Must NOT be flagged as a recruitment scam alert
    assert.equal(result.newsEvidence.alertsFound, false);
    assert.equal(result.newsEvidence.flaggedAlerts.length, 0);

    // Must not emit any recruitment scam indicator
    assert.equal(result.additionalIndicators.some((i) => i.id === 'PUBLIC_NEWS_SCAM_REPORT'), false);
  });

  it('should produce a contextual warning for fake job offers or recruitment fees without asserting the listing is fraudulent', async () => {
    serpApiService.searchNews = async () => ({
      news: [
        {
          title: 'Fake Infosys Job Offer Letter Racket Busted, 4 Arrested',
          snippet: 'Police arrested a cyber gang that duped job aspirants by issuing counterfeit appointment letters and charging ₹25,000 registration fees.',
          source: 'City Press',
          link: 'https://news.example.com/job-racket-arrests'
        }
      ]
    });

    const input = normalizeInput({
      companyName: 'Infosys Limited',
      jobTitle: 'Senior Software Engineer'
    });

    const result = await gatherSerpApiEvidence(input, { enabled: true });

    assert.equal(result.newsEvidence.alertsFound, true);
    assert.equal(result.newsEvidence.flaggedAlerts.length, 1);

    const indicator = result.additionalIndicators.find((i) => i.id === 'PUBLIC_NEWS_SCAM_REPORT');
    assert.ok(indicator, 'Expected contextual warning indicator for explicit recruitment scam report');

    // Must NOT be HIGH severity
    assert.notEqual(indicator.severity, 'HIGH');
    assert.equal(indicator.severity, 'LOW');

    // Accurate risk language: must NOT assert that the user listing is fraudulent
    assert.equal(/is fraudulent/i.test(indicator.explanation), false);
    assert.equal(/verified news publications/i.test(indicator.explanation), false);
    assert.ok(indicator.explanation.includes('contextual advisory'));

    // Preserves evidence details
    assert.equal(indicator.evidence.articleTitle, 'Fake Infosys Job Offer Letter Racket Busted, 4 Arrested');
    assert.equal(indicator.evidence.publisher, 'City Press');
    assert.equal(indicator.evidence.sourceUrl, 'https://news.example.com/job-racket-arrests');
    assert.ok(indicator.evidence.snippet.includes('counterfeit appointment letters'));
  });

  it('should not trigger a recruitment-scam warning when news mentions "fraud" without relevant recruitment evidence', async () => {
    serpApiService.searchNews = async () => ({
      news: [
        {
          title: 'Former Infosys employee involved in real estate fraud case',
          snippet: 'Police arrested three individuals accused of defrauding property buyers in a land transaction scam.',
          source: 'Metropolitan Daily',
          link: 'https://news.example.com/land-transaction-fraud'
        }
      ]
    });

    const input = normalizeInput({
      companyName: 'Infosys Limited',
      jobTitle: 'Lead Developer'
    });

    const result = await gatherSerpApiEvidence(input, { enabled: true });

    // Article kept in articles collection
    assert.equal(result.newsEvidence.articles.length, 1);

    // No recruitment scam warning triggered
    assert.equal(result.newsEvidence.alertsFound, false);
    assert.equal(result.newsEvidence.flaggedAlerts.length, 0);
    assert.equal(result.additionalIndicators.some((i) => i.id === 'PUBLIC_NEWS_SCAM_REPORT'), false);
  });

  it('should handle empty news results and news search failures gracefully', async () => {
    // Empty news results
    serpApiService.searchNews = async () => ({ news: [] });

    const input = normalizeInput({
      companyName: 'Infosys Limited',
      jobTitle: 'Developer'
    });

    const emptyResult = await gatherSerpApiEvidence(input, { enabled: true });
    assert.equal(emptyResult.newsEvidence.status, 'COMPLETED');
    assert.equal(emptyResult.newsEvidence.resultCount, 0);
    assert.equal(emptyResult.newsEvidence.articles.length, 0);
    assert.equal(emptyResult.newsEvidence.flaggedAlerts.length, 0);
    assert.equal(emptyResult.newsEvidence.alertsFound, false);
    assert.equal(emptyResult.additionalIndicators.some((i) => i.id === 'PUBLIC_NEWS_SCAM_REPORT'), false);

    // News search failure
    serpApiService.searchNews = async () => {
      throw new Error('SerpApi rate limit or network timeout');
    };

    const errorResult = await gatherSerpApiEvidence(input, { enabled: true });
    assert.equal(errorResult.newsEvidence.status, 'ERROR');
    assert.equal(errorResult.newsEvidence.error, 'News search could not be completed.');
    assert.equal(errorResult.newsEvidence.alertsFound, false);
    assert.equal(errorResult.additionalIndicators.some((i) => i.id === 'PUBLIC_NEWS_SCAM_REPORT'), false);
  });
});
