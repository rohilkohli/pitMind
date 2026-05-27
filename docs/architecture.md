<div align="center">

# 🏗️ PitMind System Architecture
**Deep Dive into the Technical Design**

[![PitMind Platform](https://img.shields.io/badge/PitMind-Platform-e10600.svg?style=for-the-badge)](#)
[![Return to Home](https://img.shields.io/badge/Return_to_Home-15151e.svg?style=for-the-badge)](../README.md)

</div>

<br/>

> [!NOTE]
> PitMind is a full-stack AI race strategy platform built for Formula 1-style environments. This document describes every layer of the system, data flows, and how the IBM AI integrations connect.

---

<details open>
<summary><b>High-Level Architecture Diagram</b></summary>
<br/>

```mermaid
flowchart LR
  subgraph Browser["🌐 Browser (React + Firebase)"]
    UI["React UI Shell\n(Dashboard / Fan Mode / Strategy)"]
    FB_RT["Firebase Realtime DB\n(live race state)"]
  end

  subgraph Backend["⚙️ Backend Core"]
    API["FastAPI Backend\n(routes / models / services)"]
    REDIS["Redis Cache\n(strategy TTL cache)"]
    PG["PostgreSQL\n(audit log persistence)"]
  end

  subgraph IBM["🧠 IBM AI Layer"]
    GRANITE["IBM Granite\n(Watsonx.ai)"]
    LF["Langflow\n(visual pipeline orchestration)"]
    DOCLING["Docling\n(PDF document AI)"]
  end

  UI -- REST/WS --> API
  FB_RT <--> UI
  API -- Firebase Admin Auth --> FB_RT
  API -- cache read/write --> REDIS
  API -- audit log --> PG
  API -- telemetry scores + prompt --> GRANITE
  API -- optional flow call --> LF --> GRANITE
  API -- PDF bytes --> DOCLING --> API
```
</details>

---

## 🧩 Component Breakdown

<details>
<summary><b>Frontend Directory (<code>frontend/</code>)</b></summary>
<br/>

The frontend is a Vite + React application utilizing a glassmorphic design system to mimic an F1 pit-wall telemetry screen.

| Component | Purpose |
|---|---|
| `pages/Dashboard.tsx` | Engineer console — 3-column resizable/draggable layout |
| `pages/FanMode.tsx` | Public fan view — battle cards, standings, AI narratives |
| `components/dashboard/ConfidenceDecompositionCard.tsx` | Explainability — breaks AI confidence into 4 dimensions |
| `components/dashboard/StreamHealthMonitor.tsx` | WebSocket health + latency |
| `hooks/useFirebaseRaceState.ts` | Firebase Realtime DB subscription for live race state |
| `contexts/RoleContext.tsx` | Engineer / Strategist / Commentator role switching |
</details>

<details>
<summary><b>Backend Directory (<code>backend/</code>)</b></summary>
<br/>

The backend is a high-performance Python FastAPI server built for concurrency and streaming.

| Module | Purpose |
|---|---|
| `main.py` | FastAPI app — CORS, middleware, WebSocket streaming, health |
| `routes/strategy.py` | Strategy scoring endpoints and Granite narration requests |
| `routes/commentary.py` | Granite chat + Docling PDF debrief upload |
| `services/granite.py` | IBM Granite client with intelligent caching |
| `services/strategy_engine.py` | Mathematical heuristic pit urgency / compound scoring |
| `services/sanitize.py` | Upload validation, CSV/JSON parsing, byte-cap enforcement |
| `services/cache_manager.py` | Redis + in-memory fallback caching with TTL |
</details>

---

## 🧠 IBM AI Pipeline Data Flow

<details open>
<summary><b>Strategy Recommendation Flow</b></summary>
<br/>

```mermaid
sequenceDiagram
    participant UI as React Frontend
    participant API as FastAPI Backend
    participant Score as Heuristic Engine
    participant Granite as IBM Granite
    
    UI->>API: POST /strategy/recommend (telemetry)
    API->>Score: calculate_pit_urgency()
    Score-->>API: returns raw scores
    API->>Granite: build_prompt(scores, telemetry)
    Granite-->>API: Natural language narration
    API-->>UI: StrategyRecommendation JSON
```

> [!IMPORTANT]
> The raw heuristic scores are calculated *before* being sent to IBM Granite. Granite is explicitly instructed to explain the mathematical recommendation, rather than guessing the math itself, ensuring absolute accuracy.

</details>

<details>
<summary><b>Post-Race Debrief (Docling) Flow</b></summary>
<br/>

1. User uploads PDF to `/api/v1/debrief/upload`
2. `_try_docling_pdf(raw)` called:
   - Uses IBM's `DocumentConverter` for Docling layout analysis
   - Exports high-fidelity Markdown, preserving tables and structure
3. `debrief_from_text(markdown_text)` called:
   - Granite assumes the role of "Senior Chief Race Strategist"
   - Generates 5-section technical debrief
4. Response returned with `source_note` showing Docling provenance (page counts, table counts).
</details>

---

## 📡 Live Telemetry Infrastructure

<details>
<summary><b>WebSocket Streaming Architecture</b></summary>
<br/>

```mermaid
flowchart TD
    Client["Browser (WebSocket Client)"]
    API["FastAPI /stream/telemetry"]
    CM["ConnectionManager (In-Memory/Redis)"]
    
    Client -- "Heartbeat Ping (30s)" --> API
    API -- "Heartbeat Pong" --> Client
    
    CM -- "1Hz Broadcast" --> API
    API -- "Live Telemetry JSON" --> Client
```

> [!TIP]
> The `StreamHealthMonitor` in the React frontend tracks packet latency and connection stability. If a disconnect occurs, the client automatically initiates an exponential backoff retry up to 10 times.
</details>

---

<div align="center">
  <p>Built for the speed of Formula 1. Engineered for absolute transparency.</p>
  <p><a href="../README.md">🏠 Back to Main README</a></p>
</div>
