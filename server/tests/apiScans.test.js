/**
 * Integration Tests for MongoDB / Scan Persistence Endpoints:
 * - POST /api/scans
 * - GET  /api/scans
 * - GET  /api/scans/:id
 *
 * Uses Node.js native test runner (node:test) and native fetch.
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const express = require('express');

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

describe('API Endpoints: /api/scans', () => {
  let createdScanId;

  it('should return 400 VALIDATION_ERROR when request body is empty', async () => {
    const res = await fetch(`${baseUrl}/api/scans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.error.code, 'VALIDATION_ERROR');
  });

  it('should return 400 VALIDATION_ERROR when assessment is missing', async () => {
    const res = await fetch(`${baseUrl}/api/scans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { companyName: 'Acme Test Corp' },
        results: { summary: {} }
      })
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.error.code, 'VALIDATION_ERROR');
  });

  it('should save a valid scan and return 201 Created', async () => {
    const payload = {
      input: {
        companyName: 'Acme Global Corp',
        jobTitle: 'Data Integrity Analyst',
        salary: '₹50,000 / month',
        location: 'Remote'
      },
      results: {
        summary: {
          assessment: 'LOW_RISK',
          headline: 'Standard Listing with Verified Information',
          indicatorCounts: { critical: 0, high: 0, medium: 0, low: 0, total: 0 },
          recommendations: ['Verify corporate email']
        },
        riskIndicators: [],
        webEvidence: { searchPerformed: false },
        jobEvidence: { searchPerformed: false },
        newsEvidence: { searchPerformed: false },
        verificationSignals: { verifiedSignals: [], missingSignals: [] },
        metadata: {
          analyzedAt: new Date().toISOString(),
          executionDurationMs: 42
        }
      }
    };

    const res = await fetch(`${baseUrl}/api/scans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data._id);
    assert.equal(body.data.input.companyName, 'Acme Global Corp');
    assert.equal(body.data.results.summary.assessment, 'LOW_RISK');

    createdScanId = body.data._id;
  });

  it('should retrieve list of recent scans via GET /api/scans', async () => {
    const res = await fetch(`${baseUrl}/api/scans?limit=5`);

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length >= 1);

    const match = body.data.find((s) => String(s._id) === String(createdScanId));
    assert.ok(match, 'Expected newly created scan in recent scans list');
    assert.equal(match.input.companyName, 'Acme Global Corp');
  });

  it('should retrieve specific scan by ID via GET /api/scans/:id', async () => {
    assert.ok(createdScanId, 'Scan ID must exist from previous test');

    const res = await fetch(`${baseUrl}/api/scans/${createdScanId}`);

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(String(body.data._id), String(createdScanId));
    assert.equal(body.data.input.companyName, 'Acme Global Corp');
    assert.equal(body.data.results.summary.assessment, 'LOW_RISK');
  });

  it('should return 404 NOT_FOUND for nonexistent scan ID', async () => {
    const nonexistentId = '000000000000000000000000';
    const res = await fetch(`${baseUrl}/api/scans/${nonexistentId}`);

    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.error.code, 'NOT_FOUND');
  });
});
