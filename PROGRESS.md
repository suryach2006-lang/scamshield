# ScamShield - Project Progress & Handover

**Project:** ScamShield (MERN Web Application)  
**Event:** SerpApi India Hackathon 2026  
**Status Date:** October 2, 2026  

---

## 1. Project Overview & State
ScamShield is an AI/heuristic-powered fraud and scam intelligence platform built to protect users against phishing domains, job offer scams, fake websites, and digital payment (UPI) fraud by leveraging SerpApi search intelligence.

Currently, the **Node.js + Express backend foundation** and the **live SerpApi search integration** are fully implemented, verified, and committed to git.

---

## 2. Completed Features

### Backend Core (`/server`)
- **Clean Layered Architecture:** Organized into `controllers/`, `routes/`, `services/`, `middleware/`, and `utils/`.
- **Environment Management:** Reliable loading using `dotenv` pointing to `server/.env` with `server/.env.example` template.
- **Port Handling:** Configured via `PORT` environment variable with fallback to `5000`.
- **Health Check Endpoint:** `GET /api/health` returns status, uptime, environment, and timestamp.
- **Error Handling & 404 Middleware:** Centralized JSON error formatting with HTTP status codes and error identifiers.
- **Git Security:** `.gitignore` configured to ensure zero API keys or secrets are committed.

### SerpApi Integration (`server/services/serpApiService.js`)
- **Official SDK:** Installed and configured `serpapi@^2.2.1`.
- **Secure Key Isolation:** Reads strictly from `process.env.SERPAPI_KEY`; key is never logged or exposed in responses.
- **Implemented Reusable Search Functions:**
  - `searchGoogle({ q, gl, hl, num, page })` -> Normalized Google organic results, sitelinks, knowledge graph, metadata.
  - `searchJobs({ q, location, gl, hl })` -> Normalized Google Jobs listings, employer info, extensions, apply links.
  - `searchNews({ q, gl, hl })` -> Normalized Google News articles, source publishers, dates, thumbnails.
- **API Endpoints:**
  - `GET /api/search/web?q=...`
  - `GET /api/search/jobs?q=...&location=...`
  - `GET /api/search/news?q=...`
- **Validation & Safe Logging:** Validates mandatory parameters (HTTP 400 on empty `q`) and logs requests safely without credentials.
- **Live Verification:** Tested and verified against real SerpApi requests with HTTP 200 responses.

---

## 3. Architecture & Key Files

```text
ScamShield/
├── .gitignore                     # Excludes node_modules, .env files, OS artifacts
├── PROGRESS.md                    # Project handover documentation
├── client/                        # Frontend workspace (to be initialized)
└── server/
    ├── server.js                  # Express setup, middleware, and server bootstrap
    ├── .env                       # Local secrets (PORT, NODE_ENV, SERPAPI_KEY) [git-ignored]
    ├── .env.example               # Safe env template for contributors
    ├── package.json               # Backend dependencies (express, cors, dotenv, serpapi)
    ├── controllers/
    │   ├── healthController.js    # Logic for /api/health
    │   └── searchController.js    # Validation & handlers for /api/search/*
    ├── routes/
    │   ├── index.js               # Central API route aggregator
    │   ├── healthRoutes.js        # Health route definitions
    │   └── searchRoutes.js        # Web, jobs, and news route definitions
    ├── services/
    │   ├── healthService.js       # Health telemetry provider
    │   └── serpApiService.js      # SerpApi queries & normalization logic
    ├── middleware/
    │   ├── errorHandler.js        # Centralized JSON error handler
    │   └── notFoundHandler.js     # 404 route interceptor
    └── utils/
        └── logger.js              # Timestamped safe logger
```

---

## 4. Useful Commands

### Backend Commands (run inside `/server` or root)
```bash
# Navigate to backend
cd server

# Install dependencies
npm install

# Start backend server
npm start
# (or: node server.js)
```

### Verification & Testing Commands
```bash
# Health check
curl http://localhost:5000/api/health

# Google Web Search
curl "http://localhost:5000/api/search/web?q=UPI+payment+fraud"

# Google Jobs Search
curl "http://localhost:5000/api/search/jobs?q=Work+from+home+data+entry&location=India"

# Google News Search
curl "http://localhost:5000/api/search/news?q=cyber+fraud+scam+India"
```

---

### Analysis Engine Core (`server/services/analysis`)
- **Evidence-Based Warning Indicators:** Fully deterministic analysis engine evaluating recruitment listings without hallucinating facts or presenting arbitrary AI scam percentages.
- **Input Normalization (`normalizer.js`):** Supports job title, company name, job description, job URL, salary, location, and recruiter contacts across multiple payload styles (camelCase, snake_case), with automatic extraction of email domains, phone numbers, and messaging links.
- **Modular Rule Engine (`ruleEngine.js`):** Extensible architecture supporting dynamic rule registration and execution.
- **Implemented Warning Signal Rules:**
  1. `upfrontPaymentRule.js`: Detects registration fees, application charges, training fees, and equipment/kit security deposits.
  2. `employmentPaymentRule.js`: Detects demands for money to start work, prepaid tasks, and wallet recharge schemes.
  3. `sensitiveFinancialRule.js`: Detects requests for net banking passwords, UPI/ATM PINs, OTPs, blank cheques, and AnyDesk/TeamViewer remote access.
  4. `unrealisticCompensationRule.js`: Flags exaggerated daily payouts (e.g. ₹5,000–₹10,000/day) for low-skill/minimal-hour jobs.
  5. `contactChannelRule.js`: Identifies recruitment conducted exclusively via anonymous channels (Telegram/WhatsApp) or enterprise recruiters using public webmail (Gmail/Yahoo).
  6. `domainMismatchRule.js`: Detects discrepancy between stated corporate employer and recruiter domain, plus suspicious lookalike TLDs.
  7. `urgencyGuaranteedRule.js`: Identifies "direct joining without interview" and guaranteed selection claims.
  8. `taskScamRule.js`: Flags YouTube liking, Google map rating, and merchant brushing task schemes.
  9. `suspiciousUrlRule.js`: Flags link shorteners (bit.ly, etc.) and direct chat links masquerading as application URLs.
  10. `missingVerificationRule.js`: Identifies missing legal entity identities, generic placeholders ("Reputed MNC"), and missing recruiter contact details.
  
- **SerpApi Multi-Engine Intelligence Integration (`serpApiIntelligenceService.js`):**
  - **Sensible Query Construction:** Rather than dumping the entire raw input into search, builds targeted queries based on company name, job title, and location:
    - **Google Web:** Corroborates authentic employer identity, corporate presence, and Knowledge Graph (1 query).
    - **Google Jobs:** Verifies whether active openings are syndicated on verified aggregators or corporate portals (1 query).
    - **Google News:** Gathers authentic public reporting, cybercrime advisories, or impersonation fraud warnings (1 query).
  - **Strict Resource Budget:** Guaranteed maximum of **3 SerpApi search requests per analysis**.
  - **Graceful Zero-Results Handling:** Intercepts SerpApi's "Google hasn't returned any results for this query" as valid empty results (`resultCount = 0`) rather than failing.
  - **Zero Fabrication Guarantee:** Quotes only real article titles, publishers, links, and snippets without hallucinating warnings.
  - **Absence Caveat:** Explicitly does not claim search absence proves a scam; categorizes absence under objective missing verification signals.
- **Unified API Response Schema:** `POST /api/analyze` returns structured JSON containing:
  - `input`: Normalized user-provided parameters.
  - `webEvidence`: Google Web Knowledge Graph and indexed corporate portals.
  - `jobEvidence`: Google Jobs active listings and corroboration status.
  - `newsEvidence`: Google News articles and flagged recruitment fraud alerts.
  - `riskIndicators`: Array of detected indicators (with type, severity, title, explanation, evidence).
  - `verificationSignals`: Object separating `verifiedSignals` from `missingSignals`.
  - `summary`: Transparent assessment level, indicator counts, disclaimer, and recommended actions.
  - `metadata`: Execution duration and exact `serpApiRequestsMade` count.
- **Automated Tests:** 27 passing unit and integration tests under `server/tests/` runnable via `npm test`.

---

## 4. Useful Commands

### Backend Commands (run inside `/server` or root)
```bash
# Navigate to backend
cd server

# Install dependencies
npm install

# Run automated test suite (27 tests)
npm test

# Start backend server
npm start
# (or: node server.js)
```

### Verification & Testing Commands
```bash
# Health check
curl http://localhost:5000/api/health

# Run live SerpApi multi-engine integration tests (3 distinct examples)
node test_serpapi_integration.js

# Post analysis test payload
curl -X POST http://localhost:5000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"jobTitle":"Cloud Architect","companyName":"Tata Consultancy Services","location":"Bangalore"}'
```

---

## 5. What Remains (Next Steps)

1. **Database Integration (MongoDB / Mongoose):**
   - Connect to MongoDB to store user scan reports, cached search results, and known threat lists.

2. **Frontend Application (`/client`):**
   - Initialize React frontend (Vite + React recommended).
   - Build modern, responsive UI with:
     - Job Offer Scam Checker & Risk Indicator Explorer.
     - URL / Domain Inspector.
     - Threat intelligence dashboard.

3. **Hackathon Polish & Demo:**
   - Prepare demo scenarios showcasing job scam detection, UPI threat analysis, and SerpApi intelligence.

---

## 6. Known Considerations & Notes
- **Node Version:** Node `v24.21.0` is running locally; CommonJS (`require` / `module.exports`) is utilized with native test runner support (`node --test`).
- **Environment Variable:** Ensure `SERPAPI_KEY` is present in `server/.env` before running live search queries.
- **Port Usage:** Server defaults to port `5000`. If port conflicts occur, check for background node processes (`netstat -ano | findstr :5000`).

