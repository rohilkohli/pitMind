<div align="center">

# 📖 Api
**PitMind Documentation**

[![PitMind Platform](https://img.shields.io/badge/PitMind-Platform-e10600.svg?style=for-the-badge)](#)
[![Return to Home](https://img.shields.io/badge/Return_to_Home-15151e.svg?style=for-the-badge)](../README.md)

</div>

<br/>

> **Overview:** This document outlines the core concepts, configurations, and technical specifications for the **Api** module within the PitMind AI ecosystem.

---

<details>
<summary><b>PitMind API Documentation</b></summary>
<br/>

### Base URL
- Development: `http://localhost:8001`
- Production: Will depend on your deployment

### Health Endpoints

#### Get API Health
```
GET /health
GET /api/health
```

Returns basic API status and AI provider information.

**Response:**
```json
{
  "status": "ok",
  "provider": "watsonx",
  "watsonx_configured": true,
  "hf_token_loaded": false,
  "hf_model_id": "ibm-granite/granite-3.1-8b-instruct",
  "watsonx_url": "https://us-south.ml.cloud.ibm.com"
}
```

#### Get Detailed Health Metrics
```
GET /api/v1/metrics/health
```

Returns comprehensive system health metrics for the HealthConsole component.

**Response:**
```json
{
  "api": {
    "name": "API Gateway",
    "status": "healthy",
    "value": "Online",
    "lastUpdated": "2026-05-11T14:30:00.000Z"
  },
  "latency": {
    "name": "Response Latency",
    "status": "healthy",
    "value": 142,
    "unit": "ms",
    "threshold": 500,
    "lastUpdated": "2026-05-11T14:30:00.000Z"
  },
  "dataQuality": {
    "name": "Data Quality Score",
    "status": "healthy",
    "value": 96.8,
    "unit": "%",
    "threshold": 90,
    "lastUpdated": "2026-05-11T14:30:00.000Z"
  },
  "errorRate": {
    "name": "Error Rate",
    "status": "healthy",
    "value": 0.3,
    "unit": "%",
    "threshold": 2.0,
    "lastUpdated": "2026-05-11T14:30:00.000Z"
  }
}
```

### Telemetry Streaming

#### WebSocket Connection
```
WS /api/v1/stream/telemetry
```

Real-time telemetry data streaming via WebSocket.

**Client sends:**
```json
{
  "type": "ping",
  "timestamp": 1715422200000
}
```

**Server responds:**
```json
{
  "type": "pong",
  "timestamp": 1715422200000
}
```

**Server broadcasts telemetry:**
```json
{
  "type": "telemetry",
  "timestamp": "2026-05-11T14:30:00.000Z",
  "lap": 27,
  "driver": "demoDriverA",
  "speed": 285,
  "gear": 7,
  "throttle": 95,
  "brake": 0,
  "tyre_compound": "soft",
  "tyre_wear": 85.2,
  "fuel": 3.4,
  "gap_to_leader": 0.0,
  "gap_to_p2": 1.234
}
```

### Session Events

#### Get Session Events
```
GET /api/v1/events/session/{session_id}
```

Get race control events for a specific session.

**Parameters:**
- `session_id` (string, path): Session identifier

**Response:**
```json
{
  "session_id": "current_race",
  "events": [
    {
      "id": "sc_1",
      "type": "safety_car",
      "lap": 12,
      "timestamp": "2026-05-11T14:15:00.000Z",
      "description": "Safety car deployed",
      "severity": "critical"
    },
    {
      "id": "pit_1",
      "type": "pit_stop",
      "lap": 15,
      "timestamp": "2026-05-11T14:18:00.000Z",
      "description": "P1 pit stop - Soft to Hard",
      "severity": "info"
    }
  ]
}
```

### Strategy Recommendations

#### Get Strategy Recommendation
```
POST /api/v1/strategy/recommend
```

Get AI-powered strategy recommendation based on telemetry.

**Request:**
```json
{
  "circuit": "Monza",
  "driver": "VER",
  "laps": [
    {
      "lap": 1,
      "lap_time_s": 80.5,
      "tyre_wear_pct": 30,
      "gap_ahead_s": 1.5
    },
    {
      "lap": 2,
      "lap_time_s": 80.4,
      "tyre_wear_pct": 35,
      "gap_ahead_s": 1.4
    }
  ]
}
```

**Response:**
```json
{
  "action": "STAY OUT — PREPARE WINDOW",
  "confidence": 95.0,
  "evidence": [
    "Tyre life and pace stability favor extending stint.",
    "Re-evaluate after next telemetry batch or SC signal."
  ],
  "confidence_decomposition": {
    "data_quality": 96.8,
    "model_certainty": 94.2,
    "stability": 95.1,
    "regret_bound": 0.15
  }
}
```

### Error Responses

All endpoints return errors in this format:

```json
{
  "detail": "Error message describing what went wrong"
}
```

**Common HTTP Status Codes:**
- `200`: Success
- `400`: Bad Request - invalid parameters
- `401`: Unauthorized - authentication required
- `429`: Rate Limited - too many requests
- `500`: Internal Server Error
- `503`: Service Unavailable

### Rate Limiting

The API enforces rate limiting per client IP address. Default: 60 requests per minute.

Headers returned with rate limit info:
- `X-RateLimit-Limit`: Total requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Unix timestamp when limit resets

### WebSocket Reliability

The frontend automatically implements:
- Auto-reconnection with exponential backoff (1s → 30s)
- Ping/pong heartbeat every 30 seconds
- Latency measurement and reporting
- Packet loss tracking
- Connection status monitoring

If connection fails, the frontend will:
1. Attempt reconnection up to 10 times (configurable)
2. Show connection status in StreamHealthMonitor
3. Display error boundary if connection fails completely
4. Allow manual reconnect via UI button

### Authentication

Currently using Firebase Authentication. Include bearer token in Authorization header:

```
Authorization: Bearer <firebase-id-token>
```

For WebSocket connections, token can be included in query params or headers.

</details>

---

<div align="center">
  <p>Built for the speed of Formula 1. Engineered for absolute transparency.</p>
  <p><a href="../README.md">🏠 Back to Main README</a></p>
</div>
