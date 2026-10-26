# API Sentinel

> **Detect. Analyze. Protect.**  
> API Abuse Detection & Request Behavior Analytics Platform

API Sentinel is a functional cybersecurity web application engineered to instrument, monitor, detect, analyze, and mitigate malicious API request patterns, credential brute-forcing, high-frequency rate abuse, directory reconnaissance sweeps, and multivariate behavioral anomalies in real-time.

---

## 🛡️ Key Features

- **Executive Security Telemetry Dashboard**
  - Real-time traffic volume, suspicious request metrics, HTTP error rates, and active alert counters.
  - Interactive time-series volatility charts (Recharts AreaChart) and HTTP response status code distributions (PieChart).
  - Live traffic telemetry feed and recent forensic security incidents.

- **Explainable Rule-Based Detection Engine**
  - **High-Frequency Rate Abuse (DoS/Scraping)**: Evaluates requests per client IP across configurable sliding time windows.
  - **Credential Brute-Forcing**: Tracks repeated HTTP 401 Unauthorized / 403 Forbidden attempts to detect dictionary attacks and credential stuffing.
  - **Nonexistent Route Scanning**: Detects directory fuzzing and vulnerability scanners probing for unmapped endpoints resulting in repeated 404 responses.
  - **Error Bursts**: Discovers abnormal concentrations of 4xx client and 5xx server exceptions indicating payload manipulation.
  - **Smart Cooldown & Deduplication**: Prevents alarm flooding and redundant notifications for ongoing incidents.

- **Machine Learning Behavioral Anomaly Engine (Isolation Forest)**
  - Unsupervised outlier detection powered by `scikit-learn` and `pandas`.
  - Multivariate feature extraction per client IP:
    1. Total request count
    2. Failed request ratio (HTTP ≥ 400)
    3. Server error ratio (HTTP ≥ 500)
    4. Unique endpoint access breadth
    5. Mean response duration / latency
    6. HTTP write ratio (POST/PUT/DELETE/PATCH)
  - Transparent, honest reporting of unsupervised decision distributions, mean anomaly scores, and outlier proportions.
  - Interactive contamination slider for hyperparameter tuning.

- **Live Monitored API Traffic Telemetry**
  - Real-time table tracking every request evaluated by the instrumented Sentinel gateway.
  - Search by client IP or endpoint path.
  - Multi-criteria filtering by HTTP method (GET, POST, PUT, DELETE, PATCH) and HTTP status category (2xx, 3xx, 4xx, 5xx).
  - Dynamic column sorting and pagination.

- **Security Incident & Alert Management (Forensic Audit)**
  - Full incident triage workflow: mark alerts as **Open**, **Investigating**, or **Resolved** with persistent SQLite audit updates.
  - Deep forensic modal inspection providing human-readable explanations alongside raw JSON telemetry evidence.

- **Client IP Behavioral Profiling**
  - Aggregated client IP telemetry: cumulative requests, failure ratios, unique endpoints visited, and first/last seen timestamps.
  - Distinct contextual indicators (not automatic blocking or premature labeling).

- **API Endpoint Performance & Interactive Test Playground**
  - Route-level latency profiling, error rate tracking, and HTTP method distribution.
  - Live **Interactive Test Playground** allowing immediate route probing directly from the user interface.

- **Audit Reports & CSV Data Export**
  - Export structured CSV audit trails for compliance reporting and offline analysis.
  - Date-range filtering for request telemetry logs and threat incident records.

- **Dynamic Detection Thresholds Configuration**
  - Live adjustment of detection rate limits, error burst limits, cooldown timers, and ML contamination parameters.
  - Form validation with sensible min/max safety limits and SQLite persistence.

- **System Infrastructure Health**
  - Live diagnostics for FastAPI application layer, SQLite database connectivity, and ML runtime readiness.

---

## 🏗️ Architectural Overview

```
                      ┌──────────────────────────────────────┐
                      │    React + Vite + TypeScript UI      │
                      │  (Tailwind CSS, Recharts, Lucide)    │
                      └──────────────────┬───────────────────┘
                                         │  (HTTP / JSON)
                                         ▼
                      ┌──────────────────────────────────────┐
                      │        FastAPI Gateway Engine        │
                      ├──────────────────────────────────────┤
                      │  • RequestLoggingMiddleware          │
                      │  • DetectionEngine (Rule Heuristics) │
                      │  • MLAnalyticsEngine (IsolationForest│
                      │  • Monitored Sample API Routes       │
                      └──────────────────┬───────────────────┘
                                         │  (SQLAlchemy ORM)
                                         ▼
                      ┌──────────────────────────────────────┐
                      │         SQLite Local Database        │
                      │  (request_logs, alerts, settings)    │
                      └──────────────────────────────────────┘
```

---

## 🚀 Quickstart & Demonstration Guide

### 1. Prerequisites
- **Python**: Version 3.10+ (tested and verified with Python 3.14)
- **Node.js**: Version 18+ (tested and verified with Node.js v24)
- **npm**: Version 9+

### 2. Backend Setup
From the project root:
```bash
# Activate your Python virtual environment if preferred
pip install -r backend/requirements.txt

# Start the FastAPI backend server
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8001 --reload
```
The backend API and interactive documentation will be available at:
- API Root: `http://127.0.0.1:8001`
- Interactive OpenAPI Docs: `http://127.0.0.1:8001/docs`
- Health Endpoint: `http://127.0.0.1:8001/api/health`

### 3. Frontend Setup
In a new terminal window:
```bash
cd frontend

# Install dependencies (already installed during initial build)
npm install

# Start the Vite development server
npm run dev
```
Open your browser and navigate to:
```
http://localhost:5173/
```

---

## 🧪 Running Automated Tests

API Sentinel includes an automated backend test suite covering application startup, health endpoints, database transactions, detection rules, alert lifecycle status updates, settings validation, and CSV export.

```bash
# Run backend pytest suite from the project root
python -m pytest backend/tests/test_api.py -v
```
All 9 automated test suites pass cleanly.

To verify the frontend TypeScript and production bundle build:
```bash
cd frontend
npm run build
```

---

## 🎯 College Project Demonstration Steps

1. **Dashboard Overview**:
   - Open `http://localhost:5173/`.
   - Observe the dark navy sidebar branding with the tagline **"Detect. Analyze. Protect."** and real-time backend connection status pill.

2. **Simulate Traffic**:
   - In the top navigation bar, click **"Simulate API Traffic"** and select **"Full Mixed Traffic"** (or use the one-click button on the empty state).
   - Watch the metric cards update instantly with total requests, suspicious requests, failed requests, and open alerts.
   - Observe the time-series traffic area chart and status distribution donut chart.

3. **Inspect Live Traffic Telemetry**:
   - Click **Live API Traffic** in the sidebar.
   - Use the search bar to filter by client IP (e.g. `203.0.113.88`) or method (e.g. `POST`).
   - Notice the distinct color-coded method badges and HTTP status badges.

4. **Forensic Alert Investigation**:
   - Click **Threat Detection** in the sidebar.
   - Locate an alert (e.g. `AUTH_BRUTE_FORCE` or `RATE_LIMIT_SPIKE`).
   - Click **Inspect Evidence**.
   - Review the plain-English explanation and the technical forensic JSON telemetry evidence.
   - Click **Investigate** or **Resolve** to demonstrate persistent alert lifecycle updates.

5. **Machine Learning Anomaly Detection**:
   - Click **ML Analytics** in the sidebar.
   - Observe the `ACTIVE & TRAINED` status of the Isolation Forest estimator.
   - Inspect the multivariate behavioral features table and the decision score outlier calculations.
   - Adjust the contamination rate slider and click **Train / Retrain Isolation Forest**.

6. **Interactive Route Probing**:
   - Click **API Endpoints** in the sidebar.
   - Under the *Live Monitored Route Playground*, click **GET /api/demo/resource** or **GET /api/demo/error-test**.
   - Notice that requests made through the interface are logged by the middleware in real time.

7. **Export Forensic Audit CSVs**:
   - Click **Reports** in the sidebar.
   - Click **Download Request Logs (.CSV)** or **Download Threat Alerts (.CSV)** to verify generated CSV reports from actual SQLite data.

8. **Adjust Detection Thresholds**:
   - Click **Settings** in the sidebar.
   - Modify the rate limit or failed auth threshold, click **Save Configuration**, and observe the validation response.

9. **Verify System Infrastructure**:
   - Click **System Health** in the sidebar.
   - Confirm that the backend, database, and ML engine report verified operational states.

---

## 🔒 Security Architecture & Prototype Limitations

- **Instrumented Gateway Prototype**: In this local prototype demonstration, API Sentinel monitors and analyzes requests passing through its own instrumented FastAPI backend gateway. It does not claim to intercept arbitrary external network traffic outside its gateway.
- **Explainable Indicators**: Suspicious behavioral patterns are indicators for security analysts rather than deterministic proof of malicious intent.
- **No Dangerous Automatic IP Blocking**: In accordance with cybersecurity engineering best practices, client IP addresses are flagged with forensic evidence rather than blindly blocked, preventing inadvertent denial-of-service on legitimate users sharing NAT or proxy addresses.
- **Credential Hygiene**: Sensitive passwords and authentication tokens are stripped or sanitized and never persisted in raw logs.

---

## 📜 License
Developed for educational demonstration as a college mini-project.
