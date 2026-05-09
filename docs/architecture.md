# PitMind architecture

```mermaid
flowchart LR
  subgraph Client
    UI[React + Tailwind + Recharts]
    Maps[Google Maps JS optional]
    FB[Firebase RTDB optional]
  end

  subgraph Edge
    NGINX[Nginx static + /api proxy]
  end

  subgraph Backend
    API[FastAPI]
    SAN[Sanitize CSV/JSON/PDF]
    STRAT[Heuristic strategy engine]
    LF[Langflow HTTP client optional]
    GX[IBM Granite client Watsonx/Replicate]
  end

  UI --> NGINX
  Maps --> UI
  FB --> UI
  NGINX --> API
  API --> SAN --> STRAT --> GX
  STRAT --> LF
```

Telemetry uploads land on FastAPI where pandas-backed parsers normalize columns. The scoring layer produces structured scores PitMind surfaces in cards while Granite narrates the rationale. Langflow remains the visual orchestration surface: export JSON lives under `langflow-flows/` and HTTP runners can call the same preprocessing/scoring functions if lifted into Langflow Python components.
