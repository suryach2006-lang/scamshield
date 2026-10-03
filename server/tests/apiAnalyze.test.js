/**
 * Integration Tests for POST /api/analyze Endpoint
 * Uses Node.js native test runner (node:test) and native fetch.
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const express = require('express');

// Create test express app without starting the production port listener
const apiRoutes = require('../routes');
const errorHandler = require('../middleware/errorHandler');

const testApp = express();
testApp.use(express.json());
testApp.use('/api', apiRoutes);
testApp.use(errorHandler);

let server;
let baseUrl;

before(async () => {
  server = http.createServer(testApp);
  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

describe('API Endpoint: POST /api/analyze', () => {
  it('should return 400 VALIDATION_ERROR when request body is empty', async () => {
    const response = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    assert.equal(response.status, 400);
    const data = await response.json();
    assert.equal(data.success, false);
    assert.equal(data.error.code, 'VALIDATION_ERROR');
  });

  it('should analyze a high-risk job listing and return structured JSON', async () => {
    const payload = {
      jobTitle: 'Data Entry Assistant',
      companyName: 'Instant Work Pvt Ltd',
      jobDescription: 'Direct joining without interview. Candidate must pay registration fee of ₹1200 for onboarding kit. Earn up to ₹5000 daily with 1-2 hours of copy paste work. Contact HR on Telegram @fast_hire_hr.',
      salary: '₹5,000 / day',
      recruiterContact: 'Contact on Telegram @fast_hire_hr or recruiter.instawork@gmail.com',
      skipWebSearch: true
    };

    const response = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    assert.equal(response.status, 200);
    const body = await response.json();

    assert.equal(body.success, true);
    assert.ok(body.data);

    // 1. Verify User-Provided Information is present and segregated
    const { userProvided, webEvidence, warningIndicators, missingVerificationSignals, summary } = body.data;
    assert.ok(userProvided);
    assert.equal(userProvided.jobTitle, 'Data Entry Assistant');
    assert.equal(userProvided.companyName, 'Instant Work Pvt Ltd');

    // 2. Verify Web Evidence section
    assert.ok(webEvidence);
    assert.equal(typeof webEvidence.searchPerformed, 'boolean');

    // 3. Verify Detected Warning Indicators
    assert.ok(Array.isArray(warningIndicators));
    assert.ok(warningIndicators.length >= 3);

    // Verify indicator structure: type, severity, explanation, evidence
    const registrationFeeInd = warningIndicators.find((i) => i.id === 'UPFRONT_PAYMENT_FEE');
    assert.ok(registrationFeeInd);
    assert.equal(registrationFeeInd.severity, 'CRITICAL');
    assert.ok(registrationFeeInd.type);
    assert.ok(registrationFeeInd.explanation);
    assert.ok(registrationFeeInd.evidence);
    assert.ok(registrationFeeInd.evidence.matchedText.includes('registration fee'));

    // 4. Verify Missing Verification Signals
    assert.ok(Array.isArray(missingVerificationSignals));

    // Verify Risk Summary: No arbitrary percentages
    assert.ok(summary);
    assert.equal(summary.assessment, 'HIGH_RISK');
    assert.ok(summary.indicatorCounts.critical >= 1);
    assert.ok(summary.disclaimer);
    assert.equal(summary.percentage, undefined);
  });

  it('should analyze a legitimate-appearing listing with zero critical red flags', async () => {
    const payload = {
      jobTitle: 'Senior Software Engineer',
      companyName: 'Acme Technologies',
      jobDescription: 'We are seeking a full-stack engineer proficient in Node.js and React. Responsibilities include building scalable REST APIs and collaborating with cross-functional product teams.',
      location: 'Bangalore, India',
      salary: '₹25,00,000 - ₹35,00,000 per annum',
      jobUrl: 'https://careers.acme-technologies.com/jobs/456',
      recruiterContact: 'careers@acme-technologies.com',
      skipWebSearch: true
    };

    const response = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.success, true);
    assert.equal(body.data.summary.assessment, 'LOW_RISK');
    assert.equal(body.data.summary.indicatorCounts.critical, 0);
  });
});
