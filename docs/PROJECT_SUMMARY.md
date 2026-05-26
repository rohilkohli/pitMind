<div align="center">

# 📖 🏎️ PitMind — Detailed Project Summary
**PitMind Documentation**

[![PitMind Platform](https://img.shields.io/badge/PitMind-Platform-e10600.svg?style=for-the-badge)](#)
[![Return to Home](https://img.shields.io/badge/Return_to_Home-15151e.svg?style=for-the-badge)](../README.md)

</div>

<br/>

> **Overview:** This document outlines the core concepts, configurations, and technical specifications for the **🏎️ PitMind — Detailed Project Summary** module within the PitMind AI ecosystem.

---

<details>
<summary><b>Project Overview</b></summary>
<br/>

**PitMind** is a full-stack AI-powered **Formula 1 Race Strategy & Explainability Assistant** built for race engineers under high-pressure pit wall conditions. It transforms raw telemetry data into transparent, AI-narrated strategic recommendations using **IBM Granite**, ensuring trust through explainability rather than opaque black-box scores.

### Core Problem It Solves

Race engineers must synthesize hundreds of telemetry signals per lap (tyre degradation, fuel loads, gaps, sector deltas, weather) while the clock is merciless. Traditional tools output opaque scores that burn trust. PitMind provides **quantitative triggers tied to human-readable prose**, allowing engineers to defend every pit-wall decision under pressure.

---

</details>



<details>
<summary><b>Technology Stack</b></summary>
<br/>

### Frontend (React + Vite + Tailwind)

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | React 19 + Vite 6 | Modern component-based UI with HMR |
| **Styling** | Tailwind CSS 3 + PostCSS | Utility-first responsive design |
| **Charting** | Recharts 2 | Interactive telemetry & race data viz |
| **Navigation** | React Router 7 | Multi-view SPA (Dashboard, Fan Mode, Engineer) |
| **Maps** | Google Maps JS API (optional) | Circuit position visualization |
| **State** | Firebase Realtime DB + React Hooks | Live race state & engineer auth |
| **Auth** | Firebase Auth + Google OAuth | Engineer login & role-based access |
| **Icons** | Lucide React | Consistent icon library |
| **Type Safety** | TypeScript 5.7 | Full type coverage |

### Backend (FastAPI + Python 3.12)

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Server** | FastAPI 0.115 + Uvicorn | Async REST API + WebSocket streaming |
| **Data Validation** | Pydantic 2 + Pydantic Settings | Type-safe payload models & config |
| **Data Processing** | Pandas 2.2 + NumPy 2.2 | Telemetry parsing & normalization |
| **Rate Limiting** | SlowAPI | Protect endpoints from abuse |
| **File Upload** | python-multipart | Secure file handling with size caps |
| **AI Inference** | IBM Watsonx Granite (HTTP) | Natural language explanations |
| **Workflow** | Langflow (optional HTTP) | Visual pipeline orchestration |
| **Auth** | firebase-admin 6.6 | Secure engineer verification |
| **Testing** | pytest 8 + pytest-asyncio | Unit & integration tests |
| **CSV Export** | FastF1 (optional) | Real F1 session data grounding |

### Infrastructure & DevOps

- **Docker Compose**: Multi-container orchestration (API + Nginx + optional services)
- **Nginx**: Static file serving + API proxy reverse-proxy
- **Environment**: `.env` file for secrets (API keys, Firebase credentials, Watsonx URL)
- **Python Version**: 3.12 required (3.14 incompatible due to `pydantic-core` native compilation)

---

</details>



<details>
<summary><b>Architecture & Data Flow</b></summary>
<br/>

```
User (Browser)
    ↓
Frontend (React + Vite)
    ├── Engineer Dashboard | Fan Mode | Strategy Simulator
    ├── Google Maps (circuit viz)
    └── Firebase RTDB (live race state)
         ↓
Nginx Reverse Proxy (Docker)
    └── /api → FastAPI
         ↓
FastAPI Backend (8 Routes)
    ├── auth.py        → Google OAuth + Firebase token validation
    ├── strategy.py    → Strategy recommendations + AI explanations
    ├── commentary.py  → Race narrative generation
    ├── fan.py         → Public-facing fan experience
    ├── WebSocket      → Real-time telemetry streaming (/api/v1/stream/telemetry)
    └── Health/Metrics → System status & KPIs
         ↓
Strategy Engine (Heuristic Scoring)
    ├── Tyre wear analysis (latest %, trend)
    ├── Lap time degradation (8-lap rolling window)
    ├── Gap volatility (to leader, to car behind)
    └── Pit urgency calculation (0-100 scale)
         ↓
IBM Granite (Watsonx.ai or Replicate)
    └── Translates scores → Narrative explanations
         ↓
Response back to Frontend
    └── Cards + telemetry charts + AI prose
```

---

</details>



<details>
<summary><b>Key Features & Components</b></summary>
<br/>

### Engineer Dashboard (Authenticated)

- **Event Timeline**: Real-time race control events (safety cars, pit stops, incidents, weather)
- **Strategy Cards**: Pit-stop recommendations with urgency scores
- **Confidence Decomposition**: Transparent AI metrics (data quality, model certainty, stability)
- **Decision Log**: Historical annotations of strategy calls made by engineers
- **Standings Table**: Current race positions with telemetry comparisons
- **Branching Simulator**: "What-if" strategy exploration (pit timing, compound changes)
- **KPI Strip**: Live metrics (fuel consumption, tyre wear, sector deltas)

### Fan Experience (Public)

- **Live Track Map**: Approximate circuit position for leading pack
- **What-If Simulator**: Explore pit strategies without engineer credentials
- **Live Telemetry Hooks**: Demo fallback with simulated race data
- **Race Narrative**: AI-generated commentary on race events
- **Fan Battle Cards**: Direct driver comparisons (head-to-head stats)

### Stream Health Monitor

- Real-time WebSocket connection status (connected/reconnecting/error)
- Latency measurement (ping/pong heartbeat)
- Packet loss tracking
- Signal strength & link quality visualization

### API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/health` | System health & AI readiness |
| GET | `/api/v1/metrics/health` | Detailed KPIs for dashboard |
| WebSocket | `/api/v1/stream/telemetry` | Real-time telemetry (simulated for demo) |
| POST | `/api/v1/strategy/predict` | Strategy scoring & Granite narration |
| POST | `/api/v1/strategy/compare` | Driver comparison analysis |
| GET | `/api/v1/events/session/{session_id}` | Race control events |
| POST | `/api/v1/chat` | Interactive Q&A with Granite |
| GET | `/api/v1/debrief` | Post-race debrief generation |
| POST | `/auth/login` | Google OAuth flow |

---

</details>



<details>
<summary><b>Design Language (Formula 1 Styling)</b></summary>
<br/>

### Color Palette

| Element | Color | Hex |
|---------|-------|-----|
| **Primary Accent** | F1 Red | `#EF3340` |
| **Background** | Deep Black | `#0a0a0b` |
| **Panels** | Charcoal | `#121214` |
| **Text** | Off-White | `#f4f4f5` |
| **Muted** | Gray | `#9ca3af` |
| **Tyre Soft** | Red | `#f87171` |
| **Tyre Medium** | Yellow | `#facc15` |
| **Tyre Hard** | White | `#f8fafc` |
| **Tyre Intermediate** | Green | `#4ade80` |
| **Tyre Wet** | Blue | `#3b82f6` |

### Typography

- **Primary Font**: Outfit (geometric, modern, bold)
  - H1: 2.5rem, weight 800
  - H2: 2rem, weight 800
  - Body: 1rem, weight 400
- **Data Font**: IBM Plex Mono (technical, consistent width)

### UI Philosophy

- Sharp corners (rounded-lg) for modern feel
- Glow effects on primary buttons (F1 red with shadow)
- Premium animations (scale, fade, slide)
- Data-focused layouts that communicate speed & precision

---

</details>



<details>
<summary><b>AI/ML Integration</b></summary>
<br/>

### Heuristic Strategy Scoring (Transparent)

```python
pit_urgency = min(100, max(0, 
  tyre_wear × 0.65 + 
  lap_time_degradation × 120 + 
  gap_volatility × 25
))
```

Metrics calculated:
- **Tyre Wear**: Latest wear % from telemetry
- **Degradation Trend**: 8-lap rolling average (early vs. late)
- **Gap Volatility**: Standard deviation of gaps (leader + car behind)
- **Pit Urgency**: Combined 0-100 score
- **SC Probability**: Safety car likelihood (gap volatility + degradation)
- **Overtake Risk**: Threat assessment from car behind

### IBM Granite Natural Language

- **Purpose**: Translate numeric scores into prose engineers trust
- **Endpoint**: Watsonx.ai (IBM Cloud) or Replicate API
- **Use Cases**:
  - Strategy card explanations ("Why pit now vs. in 3 laps?")
  - Comparison summaries (Driver A vs. Driver B strategy divergence)
  - Race debrief narratives (post-race analysis)
  - Interactive chat follow-ups (engineer Q&A)

### Langflow Integration (Optional)

- Visual pipeline orchestration for multi-step workflows
- HTTP runner allows external data enrichment before Granite narration
- Blueprint export: `langflow-flows/pitmind_strategy_pipeline.json`
- Enables non-technical strategists to design pipelines

### Firebase Realtime Database

- Live race state (lap data, standings, events)
- Engineer session management
- Real-time sync across all connected clients

---

</details>



<details>
<summary><b>Data Models</b></summary>
<br/>

### Core Models (`backend/models/`)

- **TelemetryPayload**: Incoming lap data (lap #, driver, speed, throttle, brake, tyre wear, fuel, gaps)
- **LapPoint**: Single lap's detailed telemetry snapshot
- **StrategyRecommendation**: Structured pit-stop suggestion with scores
- **DriverCompareRequest/Response**: A/B strategy analysis
- **ChatRequest/Response**: Interactive Q&A with Granite
- **DebriefResponse**: Post-race narrative

### Frontend Types (`frontend/src/`)

- **RoleContext**: Engineer vs. Fan mode detection
- **StreamContext**: WebSocket connection management
- **StreamConnectionState**: Latency, packet loss, uptime tracking

---

</details>



<details>
<summary><b>Security & Best Practices</b></summary>
<br/>

✅ **Secrets Management**
- `.env` file (not in git) for API keys, database URLs, OAuth credentials
- `.env.example` provided as template

✅ **Rate Limiting**
- SlowAPI guards `/api/v1/*` endpoints
- Configurable `RATE_LIMIT_PER_MINUTE` setting

✅ **Input Validation**
- Pydantic models enforce type safety on all payloads
- File upload size caps (`sanitize.MAX_UPLOAD_BYTES`)
- Path sanitization for debrief uploads

✅ **CORS & Headers**
- Allow-list configured via `BACKEND_CORS_ORIGINS`
- Security headers: CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy

✅ **Authentication**
- Firebase Admin SDK for token validation
- Google OAuth for engineer login
- Role-based access (engineer vs. fan)

✅ **HTTPS Ready**
- Docker Compose includes Nginx reverse proxy
- Suitable for HTTPS termination via load balancer

---

</details>



<details>
<summary><b>Project Structure</b></summary>
<br/>

```
pitMind/
├── frontend/                    # React + Vite UI
│   ├── src/
│   │   ├── components/
│   │   │   ├── dashboard/      # 15 engineer dashboard widgets
│   │   │   ├── fan/            # Fan experience components
│   │   │   ├── layout/         # Nav, page shell
│   │   │   └── ui/             # Reusable Tailwind buttons, cards
│   │   ├── contexts/           # Role, Stream state
│   │   ├── hooks/              # useStreamConnection, useDashboardState, etc.
│   │   ├── pages/              # Dashboard, FanMode, Login
│   │   ├── services/           # API client, Firebase config
│   │   └── lib/                # Utils, Firebase init
│   ├── package.json            # npm deps (React, Tailwind, Recharts, Firebase)
│   ├── vite.config.ts          # Vite dev server & build config
│   └── tailwind.config.js       # Custom theme (F1 colors)
│
├── backend/                     # FastAPI server
│   ├── main.py                 # Entry point, routes, WebSocket manager
│   ├── config.py               # Environment & Firebase config
│   ├── models/                 # Pydantic data models (telemetry, strategy)
│   ├── routes/                 # auth.py, strategy.py, commentary.py, fan.py
│   ├── services/               # granite.py, langflow_client.py, pipeline.py
│   ├── scripts/                # export_fastf1_sample.py (optional real data)
│   ├── tests/                  # Unit tests (strategy_engine.py)
│   ├── requirements.txt         # Python deps
│   ├── pytest.ini              # Pytest config
│   └── Dockerfile              # Container image
│
├── langflow-flows/             # Exported Langflow JSON pipelines
│   └── pitmind_strategy_pipeline.json
│
├── data/                       # Sample telemetry CSV
│   └── sample_monza_r2023.csv
│
├── docs/                       # Documentation
│   ├── architecture.md         # System design
│   ├── F1_STYLING.md          # Design guide
│   ├── API.md                 # Endpoint docs
│   ├── DEPLOYMENT.md          # Production setup
│   ├── QUICKSTART.md          # Getting started
│   └── screenshots/           # Demo GIFs/PNGs
│
├── docker-compose.yml          # Multi-container orchestration
├── README.md                   # Project overview
└── scripts/                    # Local dev startup scripts
    ├── run-local.ps1          # PowerShell launcher
    └── run-local.bat          # Batch launcher
```

---

</details>



<details>
<summary><b>Current Status ✅</b></summary>
<br/>

### Running Locally

- **Backend**: `http://127.0.0.1:8000` (FastAPI + WebSocket)
- **Frontend**: `http://127.0.0.1:5173` (React dev server with HMR)
- **API Docs**: `http://127.0.0.1:8000/docs` (Swagger UI)
- **Python**: 3.12 (via `.venv312/`)
- **Node**: 20+ (npm for frontend)

### Demo Features Active

✅ Live telemetry WebSocket streaming (simulated data)
✅ Fan experience page with track map & what-if simulator
✅ Strategy engine computing pit urgency scores
✅ Heuristic scoring system fully transparent
✅ Firebase integration ready (awaiting credentials)
✅ IBM Granite integration ready (awaiting Watsonx/Replicate API key)

### Phase Completion

- **Phase 1**: Event Timeline & Explainability (✅ Complete)
- **Phase 2**: Branching Simulator & Confidence Decomposition (✅ Complete)
- **Phase 3**: Stream Hardening & Health Monitoring (✅ Complete)

---

</details>



<details>
<summary><b>Deployment Options</b></summary>
<br/>

### Docker Compose (Recommended for production)

```bash
cp .env.example .env
# Fill in API keys (Watsonx, Firebase, Google Maps, etc.)
docker compose up --build
```

- Nginx proxy at `http://localhost:8080`
- FastAPI at `http://localhost:8000` (debug)
- Health checks configured
- Auto-restart on failure

### Local Development

```bash
# Backend
cd backend && python -m venv .venv312 && .venv312/Scripts/Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000

# Frontend
cd frontend && npm install && npm run dev
# Set VITE_API_BASE_URL=http://127.0.0.1:8000
```

---

</details>



<details>
<summary><b>Key Innovation: Explainability-First Design</b></summary>
<br/>

Unlike black-box strategy tools, PitMind:

1. **Scores Transparently** — Heuristics visible in code
2. **Narrates Rationales** — Granite explains every recommendation
3. **Allows Override** — Engineers can annotate & correct AI suggestions
4. **Tracks Confidence** — Decomposition shows data quality & model certainty
5. **Audits Decisions** — Decision log captures pit-wall calls & reasoning

---

</details>



<details>
<summary><b>Dependencies & Licenses</b></summary>
<br/>

**Key Open Source Projects:**

- FastAPI (MIT)
- React (MIT)
- Tailwind CSS (MIT)
- Recharts (MIT)
- Firebase (MIT)
- Pandas (BSD-3)
- Pydantic (MIT)

---

</details>



<details>
<summary><b>Next Steps / Future Enhancements</b></summary>
<br/>

- [ ] Live FastF1 data integration (real F1 sessions)
- [ ] Multi-team strategy comparison (FIA data access)
- [ ] PDF upload for technical debriefs (Docling)
- [ ] Custom Langflow pipeline designer UI
- [ ] Mobile-responsive engineer app
- [ ] Telemetry data export (CSV/JSON)
- [ ] Historical race archive & replay
- [ ] Team collaboration (shared annotations)
- [ ] API rate-limiting per user/team

---

</details>



<details>
<summary><b>Summary</b></summary>
<br/>

**PitMind is a sophisticated full-stack application that bridges the gap between real-time data and human decision-making under pressure, making AI racing strategy trustworthy through explainability.** 🏁

The project successfully combines:
- Modern frontend technologies (React 19, Tailwind, Recharts)
- Robust backend architecture (FastAPI, WebSocket streaming)
- Transparent AI integration (Heuristic scoring + Granite narration)
- Enterprise-grade security & best practices
- Official Formula 1 design language & aesthetics

Perfect for race engineers who need to make high-stakes strategic decisions with confidence and transparency.

</details>

---

<div align="center">
  <p>Built for the speed of Formula 1. Engineered for absolute transparency.</p>
  <p><a href="../README.md">🏠 Back to Main README</a></p>
</div>
