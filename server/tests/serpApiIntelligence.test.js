/**
 * Unit Tests for SerpApi Intelligence Query Construction and Normalization
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { buildQueries, extractDomain, gatherSerpApiEvidence } = require('../services/analysis/serpApiIntelligenceService');
const { normalizeInput } = require('../services/analysis/normalizer');

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
