# ScamShield: Evaluator & Deployment Guide

> **SerpApi India Hackathon 2026**  
> Practical guide for evaluators to set up, run, evaluate, and troubleshoot ScamShield.

---

## Overview & Deployment Context

ScamShield is configured as a **local full-stack application** consisting of:
1. **Frontend:** React 19 + Vite 8 development server running on `http://localhost:5173`.
2. **Backend:** Node.js Express 5 REST API running on `http://localhost:5000`.
3. **External Services:**
   - **SerpApi:** Cloud search engine API for Google Web, Google Jobs, and Google News data retrieval.
   - **MongoDB Atlas:** Cloud database cluster storing persistent scan reports in the `scans` collection of the `scamshield` database.

> [!NOTE]
> **Deployment Status:** ScamShield is designed and delivered for local evaluation. There is no publicly hosted web URL claimed or assumed. An evaluator running this project on their own machine requires:
> 1. A valid Node.js environment (v18+).
> 2. Appropriately configured environment variables (`SERPAPI_KEY`, `MONGODB_URI`).
> 3. Appropriate MongoDB Atlas Network Access (IP whitelist) if connecting to a remote Atlas cluster.

---

## 1. Prerequisites & Clean Setup

Ensure you have the following installed on your machine:
- **Node.js:** Version `18.0.0` or higher (verified on Node.js `v22.x`). Check with:
  ```bash
  node -v
  ```
- **npm:** Version `9.0.0` or higher. Check with:
  ```bash
  npm -v
  ```
- **Git:** To clone or inspect the repository.

### Fresh Clone & Clean Dependency Installation

1. Open your terminal in a clean workspace:
   ```bash
   git clone https://github.com/suryach2006-lang/scamshield.git
   cd scamshield
   ```

2. Install backend dependencies:
   ```bash
   cd server
   npm install
   ```

3. Install frontend dependencies:
   ```bash
   cd ../client
   npm install
   cd ..
   ```

---

## 2. Environment Variable Configuration

All sensitive secrets are isolated on the backend in `server/.env`. The client contains zero credentials and proxies API calls through Vite.

### Creating `server/.env`
1. Copy the provided template in the `server` directory:
   ```bash
   cd server
   cp .env.example .env
   ```
   *(On Windows Command Prompt, use `copy .env.example .env`)*

2. Open `server/.env` in your editor and configure the values:
   ```env
   # Server Port
   PORT=5000

   # Runtime Environment
   NODE_ENV=development

   # SerpApi Secret Key (Sign up at https://serpapi.com/)
   SERPAPI_KEY=your_actual_serpapi_key_here

   # MongoDB Connection String (Atlas cluster or local instance)
   MONGODB_URI=mongodb+srv://<db_username>:<db_password>@<cluster>.mongodb.net/scamshield?retryWrites=true&w=majority
   ```

> [!IMPORTANT]
> **Security Rules:**
> - Never commit `server/.env` to Git. The project `.gitignore` ignores all `.env` files.
> - Never print, paste, or commit real API keys or MongoDB passwords into bug reports or documentation.

---

## 3. Starting the Application

The application requires two active terminal windows: one for the backend Express server and one for the frontend Vite development server.

### Terminal 1: Backend Server
```bash
cd server
npm start
```
**Expected Terminal Output:**
```
[INFO] [MongoDB] Connected successfully to mongodb+srv://<sanitized-uri> (scamshield)
[INFO] ScamShield backend running in development mode on port 5000
```
*(If MongoDB is not connected, the server will log a fallback message instead; see Section 7).*

### Terminal 2: Frontend Client
```bash
cd client
npm run dev
```
**Expected Terminal Output:**
```
  VITE v8.3.0  ready in 250 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

---

## 4. Verifying Backend Health

Before testing from the browser, verify that the backend API is live and responsive:

### Using cURL or PowerShell:
```bash
curl http://localhost:5000/api/health
```

### Or Open in Browser:
Visit: `http://localhost:5000/api/health`

**Expected JSON Response (`HTTP 200 OK`):**
```json
{
  "status": "OK",
  "message": "ScamShield backend service is running smoothly",
  "timestamp": "2026-10-10T11:05:00.000Z",
  "uptime": "25s",
  "environment": "development"
}
```

---

## 5. Submitting a Scan & Verifying Results

Open your browser to **`http://localhost:5173`**.

### Evaluation Test Case 1: Advance-Fee Scam (Preset)
1. In the **Job Listing Inspection** form, click the **"Fee Scam"** button in the *1-Click Test Scenarios* bar.
2. The form automatically fills:
   - **Company:** `Apex Data Solutions`
   - **Job Title:** `Home Based Data Entry Operator`
   - **Salary:** `₹6,000 / day`
   - **Description:** Mentions copy-paste work, direct joining without interview, and a ₹1,500 refundable registration fee.
   - **Contact:** Telegram `@apex_data_hire` & `apexwork@gmail.com`.
3. Click **"Inspect Job Listing"**.
4. **Analyzing Screen:** A 5-stage progress indicator runs:
   - Stage 1: Checking company web presence (Google Web)
   - Stage 2: Searching active postings (Google Jobs)
   - Stage 3: Checking news & fraud reports (Google News)
   - Stage 4: Synthesizing search intelligence
   - Stage 5: Evaluating threat rules
5. **Results View:**
   - **Assessment:** **HIGH RISK** (Red badge).
   - **Detected Indicators:**
     - *Mandatory Upfront Registration or Training Fee* (`CRITICAL`) with matched quote `"pay a refundable registration fee of ₹1,500"`.
     - *Unrealistic Daily Compensation* (`HIGH`) for basic typing.
     - *Recruitment Conducted via Telegram* (`HIGH`).
     - *Corporate Recruiter Using Free Public Webmail* (`MEDIUM`) for `@gmail.com`.
   - **Evidence Hub:** Shows Google Web search results and Google News search results.
   - **Verification Signals:** Highlights missing signals (unverified corporate domain, no registered hiring portal).

### Evaluation Test Case 2: Authentic Enterprise Job (Preset)
1. Click **"New Inspection"** at the top right of the results screen.
2. Click the **"Legit Job"** preset button:
   - **Company:** `Tata Consultancy Services`
   - **Job Title:** `Senior Cloud Solutions Architect`
   - **URL:** `https://www.tcs.com/careers`
   - **Contact:** `careers@tcs.com`
3. Click **"Inspect Job Listing"**.
4. **Results View:**
   - **Assessment:** **LOW RISK** (Green badge).
   - Zero critical red flags detected.
   - Matched Google Knowledge Graph and verified domain `tcs.com`.
   - Google Jobs shows active engineering listings for the employer.

---

## 6. Verifying Persistence Across Backend Restarts

A critical feature of ScamShield is that scans saved to MongoDB Atlas persist across server restarts, whereas in-memory fallback records do not.

### Step-by-Step Persistence Verification

1. **Submit a New Scan:**
   - Complete an inspection in the UI (e.g., using the "Fee Scam" preset).
   - Observe that the scan completes and is auto-saved.

2. **Verify in "Recent Scans" Section:**
   - Scroll down to the **"Recent Scan History"** grid at the bottom of the home page.
   - Confirm your newly submitted scan appears with its timestamp, title, company, and risk badge.
   - Click on the scan card to confirm that the complete report reopens without re-querying SerpApi.

3. **Restart the Backend Server:**
   - In **Terminal 1** (the server terminal), press `Ctrl + C` to stop the server process.
   - Wait 2 seconds.
   - Restart the server:
     ```bash
     npm start
     ```
   - Check the console output to confirm MongoDB reconnected:
     ```
     [INFO] [MongoDB] Connected successfully to mongodb+srv://... (scamshield)
     ```

4. **Verify Record Persistence:**
   - In your browser, refresh `http://localhost:5173`.
   - Scroll down to **"Recent Scan History"**.
   - **Verification Passed:** All previously saved scans remain present and fully accessible.
   - Alternatively, test via API in terminal:
     ```bash
     curl http://localhost:5000/api/scans
     ```
     The response will return an array containing all persisted scan documents.

---

## 7. MongoDB Atlas Configuration & Troubleshooting

ScamShield connects to MongoDB using the `MONGODB_URI` environment variable.

### Confirming the Target Database & Collection
- **Database Name:** The connection string specifies the database name at the end of the URI path (default: `scamshield`).
- **Collection Name:** Mongoose automatically maps the `Scan` model to the **`scans`** collection.
- To inspect records directly in MongoDB Atlas:
  1. Log in to [MongoDB Atlas Console](https://cloud.mongodb.com/).
  2. Click on **Database** -> **Browse Collections**.
  3. Expand the **`scamshield`** database.
  4. Select the **`scans`** collection.
  5. You will see saved scan documents with their `input`, `results`, and `createdAt` timestamp fields.

### MongoDB Atlas Network Access (IP Whitelist)
If you encounter `MongooseServerSelectionError` or a connection timeout:
1. Log in to MongoDB Atlas.
2. In the left navigation, click **Network Access** under *Security*.
3. Click the green **Add IP Address** button.
4. For hackathon evaluation across different networks, select **Allow Access From Anywhere** (`0.0.0.0/0`) or click **Add Current IP Address**.
5. Click **Confirm** and wait ~1 minute for the status to show *Active*.

### MongoDB Atlas Database User Permissions
1. In the left navigation, click **Database Access** under *Security*.
2. Ensure your user has the **Read and write to any database** (or `readWrite@scamshield`) role.
3. If your password contains special characters (e.g., `@`, `:`, `#`, `%`), they must be **URL-encoded** in the connection string (e.g., `@` becomes `%40`).

### In-Memory Fallback Behavior & Warning

> [!WARNING]
> **In-Memory Fallback vs. Database Persistence:**
> - If MongoDB is unreachable when the server starts, ScamShield outputs:
>   ```
>   [WARN] [MongoDB] Could not establish connection to ...: connection timeout
>   [WARN] [MongoDB] Running with in-memory storage fallback for scans.
>   ```
> - The server **will not crash**. The app will still allow running scans and viewing recent scans during that session.
> - However, **all in-memory scans will disappear when the Node.js process is stopped or restarted**.
> - If an evaluator wishes to verify persistence across restarts, MongoDB Atlas (or a local MongoDB daemon) must be reachable.

---

## 8. Verifying Automated Tests

Evaluators can verify the integrity of the detection engine and APIs by running the backend automated test suite:

```bash
cd server
npm test
```

**Expected Result:**
```
ℹ tests 51
ℹ suites 18
ℹ pass 51
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms ~665ms
```

### What These Tests Cover:
- **Rule Verification:** Registration fees, kit charges, task wallets, sensitive banking/OTP solicitations, Telegram recruiter channels, free webmail impersonation, URL shorteners, and generic company names.
- **Corporate Domain Verification:** Tight domain validation preventing lookalike domains (`infosys-careers-fraud.com`, `notinfosys.com`) from being falsely verified.
- **Google News Intelligence:** Ensuring news coverage of impersonation scams does not unfairly flag a legitimate company's genuine listings.
- **API Endpoints:** Request validation, analysis pipeline orchestration, and CRUD persistence in `scanController`.

---

## 9. Final Evaluator Demo Checklist

Use this checklist during your evaluation session:

| # | Step | Verification Action | Expected Outcome |
|---|---|---|---|
| 1 | **Prerequisites** | Run `node -v` | Node.js v18.0.0 or higher |
| 2 | **Tests** | Run `npm test` in `server/` | All **51 tests pass** (0 failures) |
| 3 | **Linter** | Run `npm run lint` in `client/` | 0 warnings, 0 errors |
| 4 | **Health Check** | Open `http://localhost:5000/api/health` | Returns `{"status":"OK",...}` |
| 5 | **Frontend Launch** | Open `http://localhost:5173` | UI loads with Dark/Light theme toggle |
| 6 | **Scam Preset Test** | Click "Fee Scam" -> "Inspect Job Listing" | Yields **HIGH RISK** with matched fee quotes |
| 7 | **Task Scam Preset Test** | Click "Spoof Scam" -> "Inspect Job Listing" | Yields **HIGH RISK** with task recharge & domain warnings |
| 8 | **Legit Preset Test** | Click "Legit Job" -> "Inspect Job Listing" | Yields **LOW RISK** with verified Google Knowledge Graph |
| 9 | **History Inspection** | Click any card in "Recent Scan History" | Opens complete past report instantly |
| 10 | **Restart Persistence** | Stop server (`Ctrl+C`), `npm start`, refresh browser | All saved scans remain visible in history |
