# ScamShield

> **Verify before you trust.**

ScamShield is an evidence-based recruitment and job offer intelligence platform built for the **SerpApi India Hackathon 2026**. It investigates job postings, verifies corporate identity via live SerpApi search intelligence across Google Web, Google Jobs, and Google News, and surfaces objective, rule-based warning indicators to protect job seekers from employment fraud.

---

## 1. Problem

Recruitment fraud, task-based scams, brand impersonation, and advance-fee schemes have grown rapidly across India and worldwide:

- Fraudulent operators lure job seekers via Telegram, WhatsApp, social media, and spoofed portals with promises of simple data entry, video liking, or review rating for exorbitant daily payouts.
- Victims are coerced into paying upfront "registration fees," "training deposits," or "wallet top-ups" before work begins, or tricked into revealing banking credentials and OTPs.
- Existing anti-scam tools either rely on opaque "AI scam percentages" prone to hallucination or lack live third-party corroboration to distinguish authentic corporate entities from impersonators.

---

## 2. Solution

ScamShield solves this problem by combining **deterministic recruitment fraud heuristics** with **real-time search intelligence powered by SerpApi**:

- **Evidence-Based Risk Indicators:** Evaluates listing claims against 10 strict threat rules (e.g., upfront fees, suspicious communication channels, domain mismatches, guaranteed selection).
- **Live Search Corroboration:** Cross-references the employer's stated identity across Google Web, Google Jobs, and Google News.
- **Objective Transparency:** ScamShield **does not guarantee that a listing is fraudulent**, nor does it generate arbitrary synthetic scam percentages. Instead, it provides actionable evidence, matched source quotes, verified corporate markers, and missing authenticity signals so candidates can make informed decisions.

---

## 3. How ScamShield Works

The application operates as a 3-stage intelligence pipeline:

```
[ Job Inspection Form ]
         │
         ▼  (User submits listing details or selects a 1-click preset)
[ Dedicated Analyzing View ]
         │  ├── Stage 1: Checking company web presence (Google Web)
         │  ├── Stage 2: Searching Google Jobs (Active postings)
         │  ├── Stage 3: Searching Google News (Fraud advisories)
         │  ├── Stage 4: Collecting & normalising evidence
         │  └── Stage 5: Evaluating 10 deterministic warning rules
         ▼
[ Dedicated Results View ]
         ├── Executive Assessment Badge (High, Elevated, Moderate, Low, Info)
         ├── Detected Warning Indicators with matched evidence quotes
         ├── SerpApi Evidence Hub (Google Web, Jobs, News expandable drawers)
         ├── Employer Verification Signals (Confirmed vs Missing audit)
         └── Actionable Candidate Safety Recommendations
         │
         ▼  (Auto-saved to MongoDB / in-memory cache)
[ Recent Scan History ]
         └── Instantly reopen past reports without consuming SerpApi quota
```

---

## 4. SerpApi Integration

ScamShield uses the official `serpapi` SDK on the Node.js backend. To optimize speed, accuracy, and quota usage, each analysis executes a strictly budgeted set of **3 targeted queries**:

### 1. Google Web Search (`engine: "google"`)
- **Query Format:** `"{companyName}" official site OR careers`
- **Purpose:**
  - Corroborates whether the company possesses an authenticated corporate domain.
  - Extracts the **Google Knowledge Graph** entity profile (official website, business type, description) to verify legal identity.
  - Discovers official career portals to contrast against candidate-provided application links.

### 2. Google Jobs Search (`engine: "google_jobs"`)
- **Query Format:** `"{jobTitle} {companyName}"` (appends location if provided)
- **Purpose:**
  - Determines whether the job opening is syndicated across legitimate job aggregators (e.g., LinkedIn, Indeed, Naukri, Monster).
  - Verifies whether the stated employer actively hires for the specified title.
  - Flags offers claiming to represent major enterprises when no corresponding postings exist across indexed boards.

### 3. Google News Search (`engine: "google_news"`)
- **Query Format:** `"{companyName}" (scam OR fraud OR fake OR fake offer OR arrest)`
- **Purpose:**
  - Scans for published cybercrime advisories, police FIR reports, impersonation warnings, or recruitment rackets mentioning the employer.
  - Extracts article headlines, publishers, dates, and direct links to provide candidates with immediate third-party warning context.

### Query Construction & Error Resilience
- If the employer name is omitted or generic (e.g., "Reputed MNC"), ScamShield avoids wasteful searches and flags missing identity signals.
- Zero search results are handled gracefully as "no records found" rather than false scam determinations.
- SerpApi requests run securely server-side; credentials are never exposed to the client.

---

## 5. Features

- [x] **Inspection Input Form:** Inspects company name, job title, job URL, salary, location, recruiter contacts, and full job description.
- [x] **1-Click Quick Demos:** Pre-configured test cases representing real-world scenarios:
  - *Fee Scam:* Advance-fee typing job with Telegram recruiter and registration charges.
  - *Spoof Scam:* Brand impersonation task scam using spoofed `.xyz` domain and wallet top-ups.
  - *Legit Job:* Authentic enterprise cloud architect opening (Tata Consultancy Services).
- [x] **Live 5-Stage Analyzing View:** Smooth horizontal progress tracker displaying active investigation milestones.
- [x] **10 Deterministic Heuristic Rules:**
  1. `upfrontPaymentRule`: Flags demands for registration fees, kit charges, or training deposits.
  2. `employmentPaymentRule`: Flags paying money to unlock jobs or top-up task wallets.
  3. `sensitiveFinancialRule`: Detects requests for net banking passwords, OTPs, ATM PINs, or blank cheques.
  4. `unrealisticCompensationRule`: Identifies exorbitant daily income claims for basic roles.
  5. `contactChannelRule`: Flags hiring conducted exclusively via Telegram/WhatsApp or free webmail.
  6. `domainMismatchRule`: Detects discrepancies between recruiter email domain and verified corporate portal.
  7. `urgencyGuaranteedRule`: Flags "direct joining without interview" and artificial hiring deadlines.
  8. `taskScamRule`: Detects commission schemes for liking YouTube videos or rating Google maps.
  9. `suspiciousUrlRule`: Identifies URL shorteners (`bit.ly`) or direct chat invite application links.
  10. `missingVerificationRule`: Flags anonymous or generic employer identities.
- [x] **Compact Evidence Hub:** Expandable detail drawers for Google Web, Google Jobs, and Google News source records.
- [x] **Verification Signals Audit:** 2-column comparison of confirmed corporate authenticity signals vs. missing signals.
- [x] **MongoDB Persistence:** Completed analyses are saved and viewable in **Recent Scan History**.
- [x] **Offline Cache Fallback:** Operates transparently in local development even if MongoDB is not running locally.
- [x] **Dark / Light Theme:** Custom CSS design token system with zero-flash localStorage theme persistence.
- [x] **Responsive Design:** Optimized layout for desktop, tablet, and mobile viewports.

---

## 6. Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 19, Vite 8 | Reactive UI state machine (`form` → `analyzing` → `results`) |
| **Icons** | Lucide React | Accessible, crisp UI iconography |
| **Styling** | Vanilla CSS Design Tokens | Lightweight, bespoke theme system with dark/light mode (no heavy UI frameworks) |
| **Backend** | Node.js, Express 5 | REST API, validation, error handling, search orchestration |
| **Search Intelligence** | SerpApi Official Node SDK (`serpapi`) | Google Web, Google Jobs, and Google News data retrieval |
| **Database** | MongoDB & Mongoose 9 | Persistent scan storage with in-memory fallback cache |
| **Testing** | Node.js Native Runner (`node:test`) | Unit and integration test suite (33 automated tests) |
| **Linter** | Oxlint | High-speed static analysis and lint verification |

---

## 7. Architecture

```
┌────────────────────────────────────────────────────────┐
│                   CLIENT (React 19)                    │
│   App.jsx (State Controller: form | analyzing | results)│
│   ├── JobForm.jsx (Inputs + 1-Click Quick Demos)       │
│   ├── AnalyzingScreen.jsx (5-Stage Visual Tracker)     │
│   ├── ResultsView.jsx (Summary, Rules, Recommendations)│
│   ├── EvidenceHub.jsx (Expandable SerpApi Drawers)     │
│   └── RecentScans.jsx (MongoDB Scan History Grid)      │
└───────────────────────────┬────────────────────────────┘
                            │ Fetch API (/api/*)
                            ▼
┌────────────────────────────────────────────────────────┐
│               SERVER (Node.js / Express 5)             │
│   routes/ (analyze, scans, search, health)             │
│   controllers/ (analyzeController, scanController)     │
│   middleware/ (errorHandler, notFoundHandler, CORS)    │
│                                                        │
│   services/analysis/                                   │
│   ├── normalizer.js (Input sanitization)               │
│   ├── serpApiIntelligenceService.js (3-Query Budget)   │
│   └── ruleEngine.js (10 Deterministic Threat Rules)    │
└───────────────┬────────────────────────┬───────────────┘
                │                        │
                ▼                        ▼
┌───────────────────────────────┐ ┌──────────────────────┐
│            SERPAPI            │ │  MONGODB / MONGOOSE  │
│  - Google Web Search          │ │  - Collection: scans │
│  - Google Jobs Search         │ │  - In-memory cache   │
│  - Google News Search         │ │    fallback          │
└───────────────────────────────┘ └──────────────────────┘
```

---

## 8. Setup Instructions

### Prerequisites
- Node.js 18+ installed
- A valid [SerpApi API Key](https://serpapi.com/)
- (Optional) Local MongoDB instance running on port 27017

### 1. Clone Repository
```bash
git clone https://github.com/suryach2006-lang/scamshield.git
cd scamshield
```

### 2. Configure Backend
```bash
cd server
npm install

# Copy environment template
cp .env.example .env
```
Edit `server/.env` with your settings:
```env
PORT=5000
NODE_ENV=development
SERPAPI_KEY=your_actual_serpapi_key_here
MONGODB_URI=mongodb://127.0.0.1:27017/scamshield
```

### 3. Run Backend Tests & Start Server
```bash
# Run backend test suite (33 tests)
npm test

# Start Express server on port 5000
npm start
```

### 4. Configure & Start Frontend
In a separate terminal:
```bash
cd client
npm install

# Run frontend linter
npm run lint

# Start Vite dev server on port 5173
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 9. Environment Variables

All configuration is managed securely on the backend in `server/.env`:

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `5000` | Express server port |
| `NODE_ENV` | No | `development` | Runtime environment (`development` / `production`) |
| `SERPAPI_KEY` | **Yes** | — | Private SerpApi secret key for Google search engines |
| `MONGODB_URI` | No | `mongodb://127.0.0.1:27017/scamshield` | MongoDB connection URI |

> **Security Note:** The frontend contains zero API keys or environment secrets. All communication proxies through `/api` to the Express backend.

---

## 10. API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health telemetry and uptime |
| `POST` | `/api/analyze` | Analyzes a job listing using SerpApi and the heuristic rule engine |
| `POST` | `/api/scans` | Persists completed analysis results to MongoDB |
| `GET` | `/api/scans` | Retrieves recent scan summaries (`?limit=20`) |
| `GET` | `/api/scans/:id` | Retrieves full scan document and evidence by ID |
| `GET` | `/api/search/web` | Direct Google Web search proxy via SerpApi |
| `GET` | `/api/search/jobs` | Direct Google Jobs search proxy via SerpApi |
| `GET` | `/api/search/news` | Direct Google News search proxy via SerpApi |

---

## 11. Security Notes

- **Zero Credential Leakage:** SerpApi API credentials reside solely in server environment memory. They are never transmitted to the browser, logged to consoles, or persisted into database documents.
- **Strict Payload Sanitization:** The `scanController` enforces whitelist-based field sanitization before persisting documents to prevent prototype pollution or arbitrary field injection.
- **Connection URI Masking:** MongoDB connection strings automatically mask user credentials in application logs.
- **Query Rate Limiting:** Targeted query construction caps SerpApi consumption at 3 requests per analysis, preventing denial-of-wallet issues.
- **Defensive Parsing:** String and URL parsing routines include fallback guards to ensure malformed inputs or empty search responses do not cause unhandled runtime exceptions.

---

## 12. Screenshots

| Stage | Preview |
|---|---|
| **Job Inspection Form & Presets** | ![Inspection Form](docs/screenshots/form.png) *Input listing attributes or select 1-click test cases* |
| **Dedicated Analyzing Screen** | ![Analyzing Screen](docs/screenshots/analyzing.png) *Live 5-stage progress indicator* |
| **Executive Results Summary** | ![Results Summary](docs/screenshots/summary.png) *Risk level, indicator tallies, and safety guidance* |
| **SerpApi Evidence Hub** | ![Evidence Hub](docs/screenshots/evidence.png) *Corroborated Google Web, Jobs, and News drawers* |
| **Recent Scan History** | ![Scan History](docs/screenshots/history.png) *Reopen and review previous analyses instantly* |

---

## 13. Future Improvements

- **Standalone UPI VPA Validator:** Cross-reference recruiter payment handles against known Indian NPCI fraud registries.
- **Domain WHOIS Registration Age Checker:** Corroborate newly registered domain ages (< 30 days old) often used in disposable recruitment campaigns.
- **PDF Offer Letter Parser:** Upload and parse appointment letter PDFs to extract employer details, salary, and suspicious clauses automatically.
- **Report Export & Sharing:** Download audit results as portable PDF investigation summaries or generate shareable report links.
- **Community Threat Intelligence:** Allow verified job seekers to flag confirmed scam encounters to crowdsource fraud alerts.

---

## 14. Hackathon Track

- **Event:** SerpApi India Hackathon 2026
- **Category:** Search Intelligence / Cybersecurity & Consumer Protection / Fraud Prevention
- **Core Technology:** [SerpApi](https://serpapi.com/) Multi-Engine Search API (Google Web, Google Jobs, Google News)

---

### Disclaimer
*ScamShield provides evidence-based risk indicators to assist candidate vigilance and research. An indicator highlights potential risk factors or anomalies and does not constitute a legal determination of fraud. Always independently verify job offers and company credentials through official corporate communication channels.*
