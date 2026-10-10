/**
 * Integration Tests for Static React Build Serving & SPA Fallback Routing
 * Verifies that:
 * 1. Root and frontend routes serve React's production index.html
 * 2. Static assets are served correctly
 * 3. Unmatched /api requests receive JSON 404 responses, never index.html
 * 4. Existing API endpoints continue to function
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const path = require('path');
const fs = require('fs');
const express = require('express');

const apiRoutes = require('../routes');
const notFoundHandler = require('../middleware/notFoundHandler');
const errorHandler = require('../middleware/errorHandler');

describe('Unified Deployment: Static Assets & SPA Fallback Routing', () => {
  let server;
  let baseUrl;
  const clientDistPath = path.resolve(__dirname, '../../client/dist');

  before(async () => {
    // Build client if dist/index.html does not exist
    if (!fs.existsSync(path.join(clientDistPath, 'index.html'))) {
      const { execSync } = require('child_process');
      execSync('npm run build --prefix ../client', { cwd: __dirname, stdio: 'ignore' });
    }

    const testApp = express();
    testApp.use(express.json());

    // API Routes first
    testApp.use('/api', apiRoutes);

    // Static frontend assets
    testApp.use(express.static(clientDistPath));

    // React SPA fallback
    testApp.get('{*splat}', (req, res, next) => {
      if (/^\/api(\/|$)/.test(req.originalUrl) || /^\/api(\/|$)/.test(req.path)) {
        return next();
      }

      const indexPath = path.join(clientDistPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        return res.sendFile(indexPath, (err) => {
          if (err) next(err);
        });
      }
      next();
    });

    // Not-found & Error handlers
    testApp.use(notFoundHandler);
    testApp.use(errorHandler);

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
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it('should serve index.html for GET /', async () => {
    const res = await fetch(`${baseUrl}/`);
    assert.equal(res.status, 200);
    const contentType = res.headers.get('content-type') || '';
    assert.ok(contentType.includes('text/html'), `Expected HTML content-type, got: ${contentType}`);
    const text = await res.text();
    assert.ok(text.includes('<div id="root">'), 'Expected index.html to contain root container');
  });

  it('should serve index.html for SPA routes (e.g. GET /verify-job)', async () => {
    const res = await fetch(`${baseUrl}/verify-job`);
    assert.equal(res.status, 200);
    const contentType = res.headers.get('content-type') || '';
    assert.ok(contentType.includes('text/html'), `Expected HTML content-type, got: ${contentType}`);
    const text = await res.text();
    assert.ok(text.includes('<div id="root">'), 'Expected SPA fallback to return index.html');
  });

  it('should return JSON error response for unmatched GET /api/nonexistent (never index.html)', async () => {
    const res = await fetch(`${baseUrl}/api/nonexistent`);
    assert.equal(res.status, 404);
    const contentType = res.headers.get('content-type') || '';
    assert.ok(contentType.includes('application/json'), `Expected JSON content-type, got: ${contentType}`);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error?.message?.includes('Resource not found'));
  });

  it('should return JSON error response for unmatched POST /api/unknown', async () => {
    const res = await fetch(`${baseUrl}/api/unknown`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: true })
    });
    assert.equal(res.status, 404);
    const contentType = res.headers.get('content-type') || '';
    assert.ok(contentType.includes('application/json'), `Expected JSON content-type, got: ${contentType}`);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error?.message?.includes('Resource not found'));
  });

  it('should return JSON error response for GET /api (root of /api)', async () => {
    const res = await fetch(`${baseUrl}/api`);
    assert.equal(res.status, 404);
    const contentType = res.headers.get('content-type') || '';
    assert.ok(contentType.includes('application/json'), `Expected JSON content-type, got: ${contentType}`);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error?.message?.includes('Resource not found'));
  });

  it('should continue to serve existing API routes like GET /api/health', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'OK');
  });
});
