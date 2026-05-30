<div align="center">

<img src="https://raw.githubusercontent.com/rohilkohli/pitMind/main/docs/screenshots/bemyapp_logo.png" alt="PitMind Logo" width="200"/>

# 🏎️ **PitMind**

### **AI-Powered Race Strategy & Explainability Copilot**

**Making Every Pit Decision Transparent, Explainable, and Accessible**

[![CI Pipeline](https://img.shields.io/github/actions/workflow/status/rohilG/pitMind/ci.yml?style=for-the-badge&logo=github&color=e10600&label=BUILD)](https://github.com/rohilG/pitMind/actions)
[![License](https://img.shields.io/badge/License-Educational-blue.svg?style=for-the-badge&color=15151e)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB.svg?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB.svg?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Live Demo](https://img.shields.io/badge/🚀_LIVE_DEMO-CLICK_HERE-e10600?style=for-the-badge)](https://pitmind-frontend.2adms9tj6nke.eu-de.codeengine.appdomain.cloud)

[**Live Demo**](https://pitmind-frontend.2adms9tj6nke.eu-de.codeengine.appdomain.cloud) • [**Video Pitch**](https://www.youtube.com/watch?v=ulcNTG_oc8g) • [**API Docs**](https://pitmind-backend.2adms9tj6nke.eu-de.codeengine.appdomain.cloud/docs) • [**Documentation**](./docs)

---

</div>

## 🎯 **Overview**

**PitMind** is an enterprise-grade, AI-powered race strategy copilot that transforms raw Formula 1 telemetry into **explainable pit-stop decisions**, **real-time strategy narrations**, and **fan-ready race commentary** — all in a glassmorphic, data-rich interface.

Built with **IBM Granite AI**, **Docling**, and **Langflow**, PitMind makes race strategy transparent for engineers and accessible for fans.

### **The Problem**

Formula 1 processes thousands of telemetry data points per second, but strategy tools are:
- 🔒 **Black-box** — Engineers see recommendations but not *why*
- 👥 **Inaccessible** — Fans can't understand the strategic chess match
- ⏰ **Manual** — Post-race analysis takes hours

### **The Solution**

PitMind provides:
- ✅ **Transparent AI** — 4-dimension confidence decomposition
- ✅ **Explainable Decisions** — Evidence-based strategy trace
- ✅ **Accessible Interface** — Engineer & Fan modes
- ✅ **Instant Analysis** — Real-time WebSocket telemetry
- ✅ **Production-Ready** — Enterprise security & performance

---

## ✨ **Key Features**

<table>
<tr>
<td width="50%" valign="top">

### **🧠 AI-Powered Strategy Oracle**
- **IBM Granite (Watsonx.ai)** for natural-language strategy narrations
- **Heuristic + AI hybrid** for accuracy
- **4D Confidence Decomposition** (Data Quality, Model Certainty, Stability, Regret Bound)
- **Evidence-based reasoning** with full explainability trace

</td>
<td width="50%" valign="top">

### **📊 Real-Time Telemetry**
- **High-performance WebSocket** streaming
- **Message sequencing** for ordering guarantees
- **Live strategy updates** as race evolves
- **FastF1 integration** for real race data

</td>
</tr>
<tr>
<td valign="top">

### **💬 AI Copilot Chat**
- **Context-aware Q&A** grounded in live telemetry
- **Prompt injection defenses** with 15+ pattern filters
- **Rate limiting** (10 req/min per user)
- **Multi-turn conversations** with strategy context

</td>
<td valign="top">

### **🏎️ Dual-Mode Interface**
- **Engineer Mode** — Full telemetry, AI trace, strategy tools
- **Fan Mode** — Plain-English commentary, battle cards
- **Responsive design** — Desktop, tablet, mobile
- **Glassmorphic UI** — Modern F1 aesthetic

</td>
</tr>
</table>

---

## 🏗️ **Architecture**

```mermaid
graph TB
    subgraph "Frontend - React 19"
        UI[Glassmorphic UI]
        WS[WebSocket Client]
    end

    subgraph "Backend - FastAPI"
        API[REST API]
        WSS[WebSocket Server]
        Strategy[Strategy Engine]
    end

    subgraph "AI Layer - IBM"
        Granite[IBM Granite LLM]
        Watsonx[Watsonx.ai]
        Docling[Docling PDF AI]
        Langflow[Langflow Pipeline]
    end

    subgraph "Data Layer"
        Redis[(Redis Cache)]
        Postgres[(PostgreSQL)]
    end

    UI -->|HTTPS/WSS| API
    UI <-->|Real-time| WSS
    API --> Strategy
    Strategy --> Granite
    Granite --> Watsonx
    API -->|PDF Analysis| Docling
    Strategy -->|Orchestration| Langflow
    API --> Redis
    API --> Postgres
    
    style Granite fill:#e10600
    style UI fill:#61DAFB
    style API fill:#009688
```

### **Tech Stack**

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19, TypeScript, Vite | Modern SPA with lazy loading |
| **Backend** | FastAPI, Python 3.12 | High-performance async API |
| **AI** | IBM Granite, Watsonx.ai | Strategy narration engine |
| **Document AI** | Docling | PDF intelligence |
| **Orchestration** | Langflow | Multi-step AI pipelines |
| **Database** | PostgreSQL 15 | Audit logs & persistence |
| **Cache** | Redis 7 | Multi-tier caching |
| **Telemetry** | FastF1, WebSocket | Live race data streaming |
| **Deployment** | Docker, IBM Cloud Engine | Production infrastructure |

---

## 🚀 **Quick Start**

### **Prerequisites**

- **Python 3.12+**
- **Node.js 24+**
- **Docker & Docker Compose** (recommended)
- **IBM Watsonx.ai API Key** ([Get one here](https://cloud.ibm.com/iam/apikeys))
- **Firebase Project** (for authentication)

### **Option 1: Docker (Recommended)**

```bash
# 1. Clone the repository
git clone https://github.com/rohilkohli/pitMind.git
cd pitMind

# 2. Configure environment
cp .env.example .env
# Edit .env with your API keys

# 3. Start all services
docker-compose up --build

# 4. Access the application
# Frontend: http://localhost:8080
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### **Option 2: Local Development**

<details>
<summary><b>Click to expand local setup instructions</b></summary>

```bash
# Backend
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head  # Run migrations
uvicorn main:app --reload --port 8000

# Frontend (in new terminal)
cd frontend
npm install
npm run dev  # Starts on http://localhost:5173
```

</details>

### **Environment Variables**

Copy `.env.example` to `.env` and configure:

```bash
# Required
WATSONX_API_KEY=your-ibm-api-key
WATSONX_PROJECT_ID=your-project-id
FIREBASE_PROJECT_ID=your-firebase-project

# Optional
REDIS_URL=redis://localhost:6379/0
DATABASE_URL=postgresql+asyncpg://user:pass@localhost/pitmind
```

📖 See [**Environment Configuration Guide**](./docs/guides/DEPLOYMENT_CHECKLIST.md) for all variables.

---

## 📸 **Screenshots**

<table>
<tr>
<td align="center">
<img src="https://raw.githubusercontent.com/rohilkohli/pitMind/main/docs/screenshots/login_page.png" alt="Authentication Portal" width="400"/>
<br/><b>🔐 Authentication Portal</b>
</td>
<td align="center">
<img src="https://raw.githubusercontent.com/rohilkohli/pitMind/main/docs/screenshots/race_live_engineer_mode.png" alt="Live Engineer Dashboard" width="400"/>
<br/><b>📊 Live Engineer Dashboard</b>
</td>
</tr>
<tr>
<td align="center">
<img src="https://raw.githubusercontent.com/rohilkohli/pitMind/main/docs/screenshots/strategy_page.png" alt="Strategy Console" width="400"/>
<br/><b>🧠 AI Strategy Console</b>
</td>
<td align="center">
<img src="https://raw.githubusercontent.com/rohilkohli/pitMind/main/docs/screenshots/race_live_fan_mode.png" alt="Fan Mode" width="400"/>
<br/><b>🏁 Fan-Friendly Live Mode</b>
</td>
</tr>
</table>

---

## 🔒 **Security & Performance**

**PitMind is production-ready** with enterprise-grade security and performance:

### **Security Features**

✅ **Authentication:** Firebase JWKS signature verification (no bypass)  
✅ **Authorization:** Token-based with expiration validation  
✅ **Headers:** CSP, HSTS, X-XSS-Protection, X-Frame-Options  
✅ **CORS:** Explicit whitelist, no wildcards  
✅ **Rate Limiting:** Tiered, endpoint-specific (AI: 10/min, PDF: 5/min)  
✅ **Input Validation:** SQL injection, XSS, prompt injection defenses  
✅ **WebSocket Security:** Session validation, injection pattern detection  
✅ **Output Validation:** System prompt leakage prevention

**Security Audits:**
- [Backend Security Fixes](./docs/technical/SECURITY_FIXES.md)
- [Frontend Security Audit](./docs/technical/FRONTEND_SECURITY_AUDIT.md)

### **Performance Metrics**

| Metric | Target | Achieved |
|--------|--------|----------|
| **API Response Time (p95)** | <500ms | ✅ <350ms |
| **WebSocket Latency** | <100ms | ✅ <50ms |
| **Cache Hit Rate** | >50% | ✅ ~65% |
| **Database Pool** | 20 connections | ✅ Optimized |
| **Redis Pool** | 50 connections | ✅ 400% increase |
| **Concurrent Users** | 250+ WebSocket | ✅ Supported |

**Performance Enhancements:**
- Database connection pool: 5 → 20 (+300%)
- Redis pool: 10 → 50 (+400%)
- WebSocket capacity: 50 → 250 clients (+400%)
- AI endpoint protection: 92% DoS mitigation

---

## 📚 **Documentation**

### **Getting Started**
- 🚀 [**Quickstart Guide**](./docs/QUICKSTART.md) — Get running in 5 minutes
- 🏭 [**Production Deployment**](./PRODUCTION_READY.md) — Enterprise deployment guide
- 🐳 [**Docker Setup**](./docs/DEPLOYMENT.md) — Container orchestration

### **Technical Guides**
- 🔌 [**API Reference**](./docs/API.md) — REST & WebSocket endpoints
- 🏗️ [**Architecture Deep Dive**](./docs/architecture.md) — System design & data flow
- 🗄️ [**Database Setup**](./docs/DATABASE_SETUP.md) — PostgreSQL schema & migrations
- 💾 [**Caching Strategy**](./docs/CACHING.md) — Multi-tier cache design
- 🧪 [**Testing Guide**](./docs/TESTING.md) — Test suites & CI/CD

### **Operations**
- 📊 [**Monitoring Setup**](./docs/guides/MONITORING_SETUP.md) — Metrics, alerts, dashboards
- 🛠️ [**Troubleshooting**](./docs/TROUBLESHOOTING.md) — Common issues & solutions
- 🔐 [**Security Checklist**](./docs/guides/DEPLOYMENT_CHECKLIST.md) — Pre-deployment verification

### **Reference**
- 🎨 [**F1 Styling Guide**](./docs/F1_STYLING.md) — UI design system
- 📝 [**Changelog**](./CHANGELOG.md) — Version history

---

## 🛡️ **Testing**

Comprehensive test coverage across backend and frontend:

```bash
# Backend tests
cd backend
pytest tests/ -v --cov=. --cov-report=html

# Frontend tests
cd frontend
npm run test -- --coverage

# Integration tests
pytest tests/test_integration_full.py -v

# Security tests
npm audit
pip-audit
```

**Test Coverage:**
- Backend: >80% coverage
- Frontend: Component + hook tests
- Integration: Full API + WebSocket flows
- Security: Automated vulnerability scanning

---

## 🚢 **Deployment**

### **Production Deployment (IBM Cloud Code Engine)**

```bash
# 1. Install IBM Cloud CLI
curl -fsSL https://clis.cloud.ibm.com/install/linux | sh

# 2. Login
ibmcloud login --sso

# 3. Deploy backend
ibmcloud ce application create \
  --name pitmind-backend \
  --image your-registry/pitmind-backend:latest \
  --port 8000 \
  --min-scale 1 --max-scale 10 \
  --env-from-secret pitmind-secrets

# 4. Deploy frontend
ibmcloud ce application create \
  --name pitmind-frontend \
  --image your-registry/pitmind-frontend:latest \
  --port 80 \
  --min-scale 1 --max-scale 5
```

📖 Full deployment guide: [**PRODUCTION_READY.md**](./PRODUCTION_READY.md)

---

## 🤝 **Contributing**

We welcome contributions! Please see our contributing guidelines:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'feat: add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### **Development Guidelines**

- Follow existing code style (Black for Python, Prettier for TypeScript)
- Add tests for new features
- Update documentation
- Ensure CI pipeline passes

---

## 📊 **Project Status**

<table>
<tr>
<td align="center"><b>Build</b><br/>✅ Passing</td>
<td align="center"><b>Tests</b><br/>✅ 80%+ Coverage</td>
<td align="center"><b>Security</b><br/>✅ Hardened</td>
<td align="center"><b>Docs</b><br/>✅ Complete</td>
</tr>
<tr>
<td align="center"><b>Performance</b><br/>✅ Optimized</td>
<td align="center"><b>Type Safety</b><br/>✅ Full</td>
<td align="center"><b>Mobile</b><br/>✅ Responsive</td>
<td align="center"><b>Production</b><br/>✅ Ready</td>
</tr>
</table>

### **Recent Improvements**

- ✅ **18 Security Vulnerabilities Fixed** (3 critical, 12 high, 3 medium)
- ✅ **8 Frontend Bugs Resolved** (type safety, UX, performance)
- ✅ **300-400% Performance Gains** (connection pools, caching)
- ✅ **Enterprise Security** (CSP, HSTS, rate limiting, input validation)
- ✅ **Production Deployment** (Docker, IBM Cloud Engine)

---

## 📄 **License**

This project is licensed for **educational purposes**.

---

## 🙏 **Acknowledgments**

<div align="center">

### **Powered By**

<table>
<tr>
<td align="center" width="25%">
<img src="https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg" height="40" alt="IBM"/>
<br/><b>IBM Watsonx.ai</b>
</td>
<td align="center" width="25%">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" height="40" alt="React"/>
<br/><b>React 19</b>
</td>
<td align="center" width="25%">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/fastapi/fastapi-original.svg" height="40" alt="FastAPI"/>
<br/><b>FastAPI</b>
</td>
<td align="center" width="25%">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg" height="40" alt="Docker"/>
<br/><b>Docker</b>
</td>
</tr>
</table>

**Special Thanks:** IBM Granite Team • FastF1 Community • Watsonx.ai Platform

<br/>

<img src="https://raw.githubusercontent.com/rohilkohli/pitMind/main/docs/screenshots/bemyapp_banner.png" alt="Partners" width="600"/>

---

### **Built with ❤️ for the speed of Formula 1**
### **Engineered for absolute transparency**

**[⭐ Star this repo](https://github.com/rohilkohli/pitMind)** if you find it useful!

</div>
