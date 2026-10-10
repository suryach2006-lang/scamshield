# ScamShield

> **Evidence-Based Job Listing & Recruitment Fraud Intelligence Platform**  
> Built for the **SerpApi India Hackathon 2026**

ScamShield protects job seekers from employment fraud, task-based scams, brand impersonation, and advance-fee schemes. It analyzes job listing attributes against 10 deterministic threat detection rules and cross-corroborates corporate authenticity in real time using multi-engine search intelligence from **SerpApi** (Google Web, Google Jobs, and Google News).

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Problem Statement & Solution](#2-problem-statement--solution)
3. [Key Features](#3-key-features)
4. [How It Works (Workflow Pipeline)](#4-how-it-works-workflow-pipeline)
5. [Technology Stack](#5-technology-stack)
6. [Architecture](#6-architecture)
7. [Prerequisites](#7-prerequisites)
8. [Installation & Local Setup](#8-installation--local-setup)
9. [Environment Configuration](#9-environment-configuration)
10. [Environment Example](#10-environment-example)
11. [API Documentation](#11-api-documentation)
12. [Database & Scan History Persistence](#12-database--scan-history-persistence)
13. [Testing](#13-testing)
14. [Troubleshooting Guide](#14-troubleshooting-guide)
15. [Limitations & Responsible Use](#15-limitations--responsible-use)
16. [Hackathon Demo & Evaluation Checklist](#16-hackathon-demo--evaluation-checklist)
17. [License & Credits](#17-license--credits)

---

## 1. Project Overview

**ScamShield** is an evidence-first recruitment fraud analyzer. Rather than returning opaque "AI probability percentages" that hallucinate or mislead candidates, ScamShield produces objective, explainable assessments backed by:
- **Direct quote extraction** of predatory phrases (fees, task recharges, credentials requests).
- **Live Google Search verification** via SerpApi to confirm registered corporate domains and official Knowledge Graph profiles.
- **Active job board corroboration** via Google Jobs to verify whether the employer actively hires for the stated role.
- **Advisory and news monitoring** via Google News to check for known impersonation rackets, cybercrime police FIRs, or recruitment warnings.
- **Persistent historical records** backed by MongoDB Atlas with a zero-crash in-memory fallback.

---

## 2. Problem Statement & Solution

### The Problem
Recruitment scams have evolved into an industrial-scale cybercrime operation across India and globally:
- **Advance-Fee Fraud:** Unsuspecting applicants are promised data-entry or work-from-home roles and coerced into paying "registration charges," "training fees," or "security deposits" before receiving offer letters.
- **Task & Prepaid Recharges:** Victims are lured into Telegram/WhatsApp groups with promises of quick daily commissions for liking YouTube videos or writing Google reviews, only to lose significant funds to fake "recharge wallets."
- **Brand Impersonation:** Scammers spoof recognizable enterprises (e.g., TCS, Wipro, Infosys) using lookalike domains (e.g., `wipro-portal.xyz`), free webmail addresses (`recruitment-wipro@gmail.com`), or messaging channels.
- **Lack of Corroboration:** Existing consumer tools either lack real-time web verification or rely on black-box LLM scoring that cannot cite primary sources.

### The Solution
ScamShield provides an objective, two-pronged analysis:
1. **Rule-Based Threat Heuristics:** Evaluates listings against 10 deterministic rules built specifically for employment fraud markers.
2. **Real-Time SerpApi Grounding:** Queries Google Web, Jobs, and News to establish whether the claimed company exists, operates an authenticated corporate domain, actively hires for the position, or is the subject of public fraud advisories.
3. **Transparent Reporting:** Highlights confirmed authentication markers vs. missing signals, provides actionable safety advice, and saves report records for post-investigation review.

---

## 3. Key Features

All features listed below are verified in the active codebase:

- **Comprehensive Listing Input:** Ingests company name, job title, job URL, salary, location, recruiter contacts, and job descriptions.
- **1-Click Evaluation Presets:** Instant loading of realistic testing scenarios directly in the UI:
  - *Advance-Fee Scam:* Typing operator role demanding ₹1,500 registration deposit via Telegram.
  - *Task/Impersonation Scam:* Claimed Wipro role directing to `.xyz` domain demanding task wallet recharges.
  - *Authentic Enterprise Opening:* Senior Cloud Solutions Architect opening at Tata Consultancy Services (`tcs.com`).
- **Interactive 5-Stage Analyzing Screen:** Smooth visual milestone indicator tracking active search and heuristic evaluation steps.
- **10 Deterministic Threat Detection Rules:**
  1. `upfrontPaymentRule`: Identifies mandatory registration fees, kit charges, or training deposits while preserving legitimate non-fee corporate disclaimers.
  2. `employmentPaymentRule`: Flags requirements to pay money, purchase packages, or top-up wallets to unlock work.
  3. `sensitiveFinancialRule`: Flags demands for net banking credentials, OTPs, ATM PINs, blank cheques, or remote desktop software (AnyDesk, TeamViewer).
  4. `unrealisticCompensationRule`: Flags unrealistic compensation models (e.g., ₹6,000–₹8,000/day for basic copy-paste tasks).
  5. `contactChannelRule`: Flags recruitment conducted exclusively over Telegram, WhatsApp, or through public free webmail (`@gmail.com`, `@yahoo.com`).
  6. `domainMismatchRule`: Identifies discrepancies between the recruiter's domain and the company's verified corporate domain; rejects lookalike domains.
  7. `urgencyGuaranteedRule`: Detects guaranteed selection without interview and artificial high-pressure hiring deadlines.
  8. `taskScamRule`: Flags commission schemes based on liking social media posts, rating maps, or prepaid task completion.
  9. `suspiciousUrlRule`: Detects URL shorteners (`bit.ly`, `tinyurl.com`) concealing true destinations, direct chat invite links, and high-risk TLDs.
  10. `missingVerificationRule`: Flags anonymous or vague employer identities (e.g., "Reputed MNC", "Top IT Firm").
- **SerpApi Evidence Hub:** Expandable accordions displaying retrieved Google Web, Google Jobs, and Google News metadata and snippets.
- **Verification Signals Audit:** Side-by-side comparison of confirmed corporate authenticity signals versus missing safety signals.
- **MongoDB Persistence & History View:** Saves every scan to MongoDB Atlas with instant retrieval, search limits, and dedicated single-scan inspection.
- **Zero-Crash In-Memory Fallback:** Seamlessly caches scans in application memory if MongoDB is offline, ensuring the app remains fully testable.
- **Adaptive Dark / Light Theme:** Custom Vanilla CSS design token system with zero-flicker theme persistence via `localStorage`.

---

## 4. How It Works (Workflow Pipeline)

```
[ User Input / 1-Click Preset ]
              │
              ▼  (HTTP POST /api/analyze)
[ 1. Input Normalization ]
      ├── Sanitizes strings, strips invalid characters
      └── Extracts recruiter emails, phone numbers, Telegram/WhatsApp handles
              │
              ▼
[ 2. SerpApi Search Intelligence (3-Query Budget) ]
      ├── Google Web Search:   "{company}" official site OR careers
      │                        └── Extracts official domain & Google Knowledge Graph
      ├── Google Jobs Search:  "{title} {company}"
      │                        └── Verifies active syndicated listings across job boards
      └── Google News Search:  "{company}" (scam OR fraud OR fake OR fake offer OR arrest)
                               └── Retrieves published fraud alerts and advisories
              │
              ▼
[ 3. Deterministic Heuristic Engine ]
      └── Evaluates 10 threat rules against input + SerpApi evidence
              │
              ▼
[ 4. Evidence Aggregation & Risk Assessment ]
      ├── Calculates risk severity (HIGH_RISK, ELEVATED_RISK, MODERATE_RISK, LOW_RISK)
      ├── Compiles matched quotes & safety recommendations
      └── Emits structured analysis payload
              │
              ▼  (HTTP POST /api/scans)
[ 5. Persistence Layer ]
      ├── MongoDB Atlas: Permanently stored in 'scans' collection
      └── (Fallback): In-memory buffer if database is disconnected
              │
              ▼
[ Results Presentation & Recent Scans History ]
```

---

## 5. Technology Stack

### Frontend (`client/`)
| Component | Technology | Version | Purpose |
|---|---|---|---|
| Framework | React | 19.2.8 | Reactive component rendering and state orchestration |
| Build Tool | Vite | 8.3.0 | Fast HMR dev server and production asset bundler |
| Icons | Lucide React | 1.50.0 | Clean, accessible UI icons |
| Styling | Vanilla CSS | Custom Tokens | Responsive layout, dark/light theme, micro-animations |
| Code Quality | Oxlint | 1.81.0 | Fast static analysis and linting |

### Backend (`server/`)
| Component | Technology | Version | Purpose |
|---|---|---|---|
| Runtime | Node.js | >= 18.0.0 | JavaScript runtime engine |
| Web Server | Express | 5.2.1 | REST API routing, JSON body parsing, error handling |
| Search API | SerpApi SDK | 2.2.1 | Official Node.js SDK for Google search engines |
| Database ODM | Mongoose | 9.11.0 | Object data modeling for MongoDB Atlas |
| Environment | dotenv | 18.0.5 | Safe loading of server-side environment variables |
| Cross-Origin | cors | 2.8.6 | CORS middleware for secure API proxying |
| Test Runner | Node.js Test Runner | Native (`node:test`) | Unit, rule, integration, and API endpoint test suites |

---

## 6. Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (React 19)                        │
│   App.jsx (View Controller: 'form' | 'analyzing' | 'results')    │
│   ├── Header.jsx (Theme toggler, navigation)                    │
│   ├── JobForm.jsx (Manual inputs + 1-click test presets)        │
│   ├── AnalyzingScreen.jsx (5-Stage animated milestone tracker)  │
│   ├── ResultsView.jsx (Executive badge, indicators, advice)     │
│   ├── EvidenceHub.jsx (Google Web, Jobs, & News drawers)        │
│   ├── VerificationSignalsSection.jsx (Confirmed vs Missing)     │
│   └── RecentScans.jsx (Historical reports grid & detail modal)  │
└────────────────────────────────┬────────────────────────────────┘
                                 │ HTTP / JSON via Vite Proxy (/api/*)
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SERVER (Node.js / Express 5)                 │
│   routes/                                                       │
│   ├── healthRoutes.js   -> GET  /api/health                     │
│   ├── analyzeRoutes.js  -> POST /api/analyze                    │
│   ├── scanRoutes.js     -> POST, GET /api/scans, GET /:id       │
│   └── searchRoutes.js   -> GET  /api/search/{web,jobs,news}     │
│                                                                 │
│   services/analysis/                                            │
│   ├── normalizer.js                 (Input hygiene)             │
│   ├── serpApiIntelligenceService.js (3-Query budget manager)    │
│   └── ruleEngine.js                 (10 Deterministic rules)    │
└───────────────────┬─────────────────────────────┬───────────────┘
                    │                             │
                    ▼                             ▼
┌───────────────────────────────────┐ ┌───────────────────────────┐
│              SERPAPI              │ │       PERSISTENCE         │
│  - Google Web Search (Knowledge)  │ │  Primary: MongoDB Atlas   │
│  - Google Jobs Search (Postings)  │ │           ('scans' coll)  │
│  - Google News Search (Advisories)│ │  Fallback: In-Memory cache│
└───────────────────────────────────┘ └───────────────────────────┘
```

---

## 7. Prerequisites

Before installing, ensure your environment meets the following requirements:
- **Node.js:** `v18.0.0` or higher (tested on Node.js `v22.x`)
- **npm:** `v9.0.0` or higher
- **SerpApi API Key:** Required for live Google search queries ([Sign up at SerpApi](https://serpapi.com/))
- **MongoDB Instance:** MongoDB Atlas cluster URI or a local MongoDB service (`mongodb://127.0.0.1:27017/scamshield`). *Note: ScamShield will still function using its in-memory fallback if MongoDB is not provided.*

---

## 8. Installation & Local Setup

### 1. Clone the Repository
```bash
git clone https://github.com/suryach2006-lang/scamshield.git
cd scamshield
```

### 2. Configure & Start the Backend
Open a terminal in the root directory:
```bash
cd server
npm install

# Copy environment template
cp .env.example .env
```
Open `server/.env` and insert your credentials (never share or commit this file):
```env
PORT=5000
NODE_ENV=development
SERPAPI_KEY=your_actual_serpapi_key_here
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/scamshield?retryWrites=true&w=majority
```

Start the backend server:
```bash
npm start
```
*Expected log output:*
```
[INFO] [MongoDB] Connected successfully to mongodb+srv://... (scamshield)
[INFO] ScamShield backend running in development mode on port 5000
```

### 3. Configure & Start the Frontend
In a **second terminal**, start the client application:
```bash
cd client
npm install

# Start Vite development server
npm run dev
```
Open your browser and navigate to **`http://localhost:5173`**.

---

## 9. Environment Configuration

All configuration is managed securely on the server. The client contains **zero** API keys or secrets.

| Variable | Required | Default Value | Description |
|---|---|---|---|
| `PORT` | No | `5000` | Port for the Express server to bind. |
| `NODE_ENV` | No | `development` | Runtime environment (`development`, `production`, `test`). |
| `SERPAPI_KEY` | **Yes** (for live search) | — | SerpApi secret key for Google Web, Google Jobs, and Google News. |
| `MONGODB_URI` | Recommended | `mongodb://127.0.0.1:27017/scamshield` | MongoDB Atlas or local connection string. If omitted, in-memory store activates. |

> **Security Note:** The root `.gitignore` explicitly prevents `.env`, `server/.env`, and any `.env.*` files from being committed to source control.

---

## 10. Environment Example

A clean template file is provided at `server/.env.example`:

```bash
# Server Port (Default: 5000)
PORT=5000

# Node Runtime Environment
NODE_ENV=development

# SerpApi Secret Key (from https://serpapi.com/)
SERPAPI_KEY=your_serpapi_api_key_here

# MongoDB Connection String (Atlas or Local)
MONGODB_URI=mongodb://127.0.0.1:27017/scamshield
```

---

## 11. API Documentation

### 1. Backend Health Check
- **Endpoint:** `GET /api/health`
- **Description:** Verifies service uptime and runtime environment.
- **Response `200 OK`:**
```json
{
  "status": "OK",
  "message": "ScamShield backend service is running smoothly",
  "timestamp": "2026-10-10T11:00:00.000Z",
  "uptime": "142s",
  "environment": "development"
}
```

### 2. Analyze Job Listing
- **Endpoint:** `POST /api/analyze`
- **Query Parameter (Optional):** `?skipWebSearch=true` (skips SerpApi queries for rapid offline rule testing)
- **Request Body:**
```json
{
  "companyName": "Apex Data Solutions",
  "jobTitle": "Data Entry Specialist",
  "jobUrl": "https://example.com/apply",
  "salary": "₹7,000 / day",
  "location": "Remote",
  "recruiterContact": "hr@gmail.com, Telegram: @apex_hire",
  "jobDescription": "Direct joining without interview. Candidate must pay ₹1,500 registration fee for the software kit."
}
```
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "input": { ... },
    "summary": {
      "assessment": "HIGH_RISK",
      "headline": "Critical warning indicator detected (1 critical signal). High caution strongly advised.",
      "indicatorCounts": {
        "critical": 1,
        "high": 2,
        "medium": 1,
        "low": 0,
        "total": 4
      },
      "disclaimer": "ScamShield provides evidence-based risk indicators to assist candidate vigilance...",
      "recommendations": [
        "Cease communication immediately if asked for money, passwords, or remote device access.",
        "Never pay any upfront registration, training, or kit fee to obtain employment."
      ]
    },
    "riskIndicators": [
      {
        "id": "UPFRONT_REGISTRATION_FEE",
        "type": "FINANCIAL_SOLICITATION",
        "severity": "CRITICAL",
        "title": "Mandatory Upfront Registration or Training Fee",
        "explanation": "Demanding upfront payment before hiring is the single most common employment scam indicator.",
        "evidence": { "matchedQuotes": ["pay ₹1,500 registration fee"] }
      }
    ],
    "webEvidence": { ... },
    "jobEvidence": { ... },
    "newsEvidence": { ... },
    "verificationSignals": { ... },
    "metadata": {
      "analyzedAt": "2026-10-10T11:01:00.000Z",
      "executionDurationMs": 850,
      "serpApiRequestsMade": 3,
      "rulesEvaluatedCount": 10
    }
  }
}
```

### 3. Save Scan Analysis
- **Endpoint:** `POST /api/scans`
- **Request Body:** `{ "input": { ... }, "results": { ... } }`
- **Response `201 Created`:**
```json
{
  "success": true,
  "data": {
    "_id": "673248ab9c...",
    "input": { ... },
    "results": { ... },
    "createdAt": "2026-10-10T11:01:05.000Z"
  }
}
```

### 4. Retrieve Recent Scans
- **Endpoint:** `GET /api/scans?limit=20`
- **Response `200 OK`:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "673248ab9c...",
      "input": { "companyName": "Apex Data Solutions", "jobTitle": "Data Entry Specialist" },
      "results": {
        "summary": { "assessment": "HIGH_RISK", "headline": "Critical warning indicator detected..." }
      },
      "createdAt": "2026-10-10T11:01:05.000Z"
    }
  ]
}
```

### 5. Retrieve Scan by ID
- **Endpoint:** `GET /api/scans/:id`
- **Response `200 OK`:** Returns full scan document including full evidence drawers and indicators.
- **Response `404 Not Found`:** Returned when the scan ID does not exist.

### 6. Search Proxies (Direct SerpApi)
- `GET /api/search/web?q=...`
- `GET /api/search/jobs?q=...&location=...`
- `GET /api/search/news?q=...`

---

## 12. Database & Scan History Persistence

ScamShield implements a resilient dual-tier persistence model:

### MongoDB Atlas Persistence (Production / Recommended)
When `MONGODB_URI` points to a reachable MongoDB Atlas cluster or local MongoDB instance:
- Every completed scan is validated, sanitized against secret leakage, and written to the `scans` collection via Mongoose.
- Scans are indexed by `createdAt: -1` for rapid chronological querying.
- **Persistence Guarantee:** Saved scan records **persist indefinitely across server restarts**, network drops, or code redeployments. Existing database records are never wiped or overwritten.

### In-Memory Fallback Cache
If MongoDB is unreachable (e.g., restricted network, misconfigured credentials, or offline evaluation):
- ScamShield logs a warning and automatically activates an in-memory storage array (`inMemoryScans` in `scanController.js`).
- The user can still scan jobs, view reports, and review recent scans in the UI during that active session.
- **Important Caveat:** In-memory fallback records reside solely in Node.js process RAM. **All in-memory records are lost when the backend server process stops or restarts.** To test persistent scan history across restarts, ensure a valid MongoDB connection is established.

---

## 13. Testing

ScamShield includes automated tests running on Node.js's native test runner (`node:test`).

### Run Backend Test Suite
```bash
cd server
npm test
```

### Verified Test Results
```
ℹ tests 55
ℹ suites 19
ℹ pass 55
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms ~700ms
```

### Test Coverage Breakdown
1. **`tests/analysisRules.test.js` (27 tests across 11 suites):**
   - Validates input normalizer (camelCase/snake_case, phone/social handle extraction).
   - Validates all 10 threat rules (fee detection, non-fee denial preservation, wallet top-ups, sensitive passwords, exorbitant daily income, Telegram/WhatsApp channels, domain mismatch, task scams, shorteners, generic employers).
   - Validates dynamic custom rule registration and rule engine execution.
2. **`tests/serpApiIntelligence.test.js` (19 tests across 4 suites):**
   - Validates SerpApi query construction, title-only queries, ccTLD domain extraction (`.co.in`, `.co.uk`), and graceful skipping.
   - Validates lookalike domain rejection (preventing false-positive verified domains for `infosys-careers-fraud.com` or `notinfosys.com`).
   - Validates Google News intelligence (prevents flagging legitimate companies when news covers impersonation scams or general cybercrime).
   - End-to-end regression tests verifying legitimate corporate listings (Infosys ccTLD `.co.in`), active fraud/impersonation detection, unrelated news isolation, and unfamiliar company scam detection.
3. **`tests/apiAnalyze.test.js` (3 tests):**
   - Validates input validation errors, full scan analysis execution, and clean enterprise opening results.
4. **`tests/apiScans.test.js` (6 tests):**
   - Validates payload validation, document creation, `GET /api/scans` listing, `GET /api/scans/:id` retrieval, and `404` handling.

### Run Frontend Linter
```bash
cd client
npm run lint
```
*Result: 0 warnings and 0 errors across 15 files via Oxlint.*

---

## 14. Troubleshooting Guide

| Issue | Root Cause | Solution |
|---|---|---|
| **MongoDB connection timeout / `MongooseServerSelectionError`** | MongoDB Atlas IP access list does not permit your current IP address. | Log in to MongoDB Atlas -> **Network Access** -> Click **Add IP Address** -> Select **Allow Access From Anywhere (`0.0.0.0/0`)** or add your current public IP. |
| **`Authentication failed` on MongoDB Atlas** | Incorrect username or password in `MONGODB_URI`. Special characters in passwords must be URL-encoded. | Verify user in Atlas -> **Database Access**. Ensure password does not contain unencoded characters like `@`, `:`, or `/`. |
| **Server falls back to in-memory store** | MongoDB is offline or `MONGODB_URI` is not loaded. | Check server console on startup. Look for `[MongoDB] Connected successfully` vs `[MongoDB] Running with in-memory storage fallback`. |
| **Port 5000 already in use (`EADDRINUSE`)** | Another process is occupying port 5000. | Windows: Run `netstat -ano \| findstr :5000` and `taskkill /PID <PID> /F`, or set `PORT=5001` in `server/.env` (update proxy in `client/vite.config.js` if changed). |
| **Port 5173 already in use** | Vite dev server already running. | Vite will automatically suggest using port 5174, or kill the background process. |
| **SerpApi rate limit or invalid API key** | Missing or exhausted SerpApi quota. | Verify `SERPAPI_KEY` in `server/.env`. ScamShield handles missing or rate-limited keys gracefully by proceeding with rule-based heuristics and logging a clear warning. |
| **Frontend cannot communicate with `/api`** | Backend server is not running on port 5000. | Ensure `npm start` is actively running in the `server` directory before launching the client. |

---

## 15. Limitations & Responsible Use

- **Risk Indicators, Not Definite Proof:** ScamShield provides evidence-based risk indicators to assist candidate vigilance. An indicator highlights suspicious anomalies and does not constitute a legal determination of fraud.
- **Search Engine Coverage:** If an employer is a brand-new startup, SerpApi may return limited Google Web and Jobs results. ScamShield surfaces this transparently as "Missing Verification Signals" rather than an automatic fraud accusation.
- **Candidate Verification:** Job seekers should always independently verify offer letters by directly calling verified corporate head offices or contacting authorized human resources channels listed on official domain websites.

---

## 16. Hackathon Demo & Evaluation Checklist

For judges and evaluators reviewing ScamShield, here is a quick step-by-step verification checklist:

- [ ] **1. Clean Environment:** Node.js 18+ installed, dependencies installed in `server` and `client`.
- [ ] **2. Health Check:** Navigate to `http://localhost:5000/api/health` -> verify status is `OK`.
- [ ] **3. Automated Tests:** Run `npm test` in `server` -> verify all **55 tests pass**.
- [ ] **4. Linter Check:** Run `npm run lint` in `client` -> verify **0 errors**.
- [ ] **5. Launch UI:** Open `http://localhost:5173` -> dark/light theme switch operates smoothly.
- [ ] **6. 1-Click Fee Scam Preset:** Click **"Fee Scam"** -> Click **"Inspect Job Listing"** -> Observe 5-stage progress tracker -> Results view displays **HIGH RISK** with matched registration fee quotes.
- [ ] **7. 1-Click Impersonation Preset:** Click **"Spoof Scam"** -> Analyze -> Observe task scam indicators, `.xyz` domain warnings, and recruiter domain mismatch.
- [ ] **8. 1-Click Legitimate Preset:** Click **"Legit Job"** -> Analyze -> Observe **LOW RISK** assessment with verified TCS corporate web presence.
- [ ] **9. MongoDB Persistence Verification:**
  - View **"Recent Scans"** in the UI to see saved reports.
  - Restart the backend server (`Ctrl+C` in `server` terminal, then `npm start`).
  - Refresh the UI -> Verify that previously saved scans remain visible and can be reopened.
  - *(See [docs/DEPLOYMENT_AND_EVALUATION.md](docs/DEPLOYMENT_AND_EVALUATION.md) for full evaluator walkthrough).*

---

## 17. License & Credits

- **License:** ISC License (see `server/package.json`)
- **Hackathon:** Built for the **SerpApi India Hackathon 2026**
- **Search Intelligence:** Powered by the official [SerpApi SDK](https://serpapi.com/)
- **Author / Repository:** [suryach2006-lang/scamshield](https://github.com/suryach2006-lang/scamshield)
