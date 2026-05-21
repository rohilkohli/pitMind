# API Types Documentation

## Overview

This document provides comprehensive documentation for all TypeScript types used in the PitMind frontend API layer. These types ensure type safety when communicating with the backend and provide excellent IDE support.

## Table of Contents

- [Type Definitions Location](#type-definitions-location)
- [Core API Types](#core-api-types)
- [Strategy Types](#strategy-types)
- [Telemetry & Race State Types](#telemetry--race-state-types)
- [Chat & Commentary Types](#chat--commentary-types)
- [Fan Engagement Types](#fan-engagement-types)
- [Validation & Type Guards](#validation--type-guards)
- [Usage Examples](#usage-examples)
- [Migration Guide](#migration-guide)

---

## Type Definitions Location

All API types are defined in:
- **Primary Types**: `frontend/src/types/api.ts`
- **Validators**: `frontend/src/utils/validators.ts`
- **API Service**: `frontend/src/services/api.ts` (re-exports types for convenience)

---

## Core API Types

### `ApiResponse<T>`

Generic wrapper for API responses.

```typescript
interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}
```

### `ApiError`

Standard error response structure.

```typescript
interface ApiError {
  detail: string;
  status?: number;
  code?: string;
}
```

**Example:**
```typescript
try {
  const data = await postRecommend(payload);
} catch (error) {
  if (isApiError(error)) {
    console.error('API Error:', error.detail);
  }
}
```

---

## Strategy Types

### `StrategyRecommendation`

Complete AI-generated strategy recommendation with confidence scores and reasoning.

```typescript
interface StrategyRecommendation {
  action: string;                          // e.g., "Pit for Hard tyres"
  pit_this_lap: boolean;                   // Immediate pit recommendation
  suggested_compound: string;              // "SOFT" | "MEDIUM" | "HARD"
  scores: StrategyScores;                  // Risk/opportunity scores
  structured_reasons: string[];            // Key decision factors
  explanation: string;                     // Human-readable explanation
  evidence: string[];                      // Supporting telemetry evidence
  assumptions: string[];                   // Model assumptions
  confidence: number;                      // 0-100 confidence score
  alternative: string;                     // Alternative strategy
  pipeline_steps: string[];                // Processing pipeline steps
  confidence_decomposition?: ConfidenceDecomposition;
}
```

**Example:**
```typescript
import { postRecommend, type StrategyRecommendation } from '@/services/api';

const recommendation: StrategyRecommendation = await postRecommend({
  circuit: "Monza",
  session_label: "Race",
  driver: "VER",
  laps: [/* lap data */]
});

console.log(`Action: ${recommendation.action}`);
console.log(`Confidence: ${recommendation.confidence}%`);
```

### `StrategyScores`

Quantitative risk and opportunity scores.

```typescript
interface StrategyScores {
  pit_urgency: number;                     // 0-100: How urgent is a pit stop
  sc_probability_next_3_laps: number;      // 0-100: Safety car likelihood
  overtake_risk: number;                   // 0-100: Risk of being overtaken
  recommended_window_laps: [number, number]; // [start_lap, end_lap]
}
```

### `ConfidenceDecomposition`

Detailed confidence breakdown for transparency.

```typescript
interface ConfidenceDecomposition {
  data_quality: number;      // 0-100: Telemetry completeness
  model_certainty: number;   // 0-100: AI model confidence
  stability: number;         // 0-100: Consistency across scenarios
  regret_bound: number;      // 0-1: Max expected loss vs optimal
}
```

### `StrategyCommitRequest` & `StrategyCommitResponse`

For committing strategy decisions to audit log.

```typescript
interface StrategyCommitRequest {
  recommendation: StrategyRecommendation;
  checklist: StrategyChecklist;
  execution_brief: string;
  session_context?: Record<string, unknown>;
}

interface StrategyCommitResponse {
  audit_id: string;
  status: string;
  message: string;
  committed_at: string;
}
```

**Example:**
```typescript
const response = await postCommitStrategy({
  recommendation,
  checklist: {
    pit_crew_ready: true,
    tyre_set_confirmed: true,
    radio_call_prepared: true
  },
  execution_brief: "Pit for hard tyres on lap 23"
});

console.log(`Committed with ID: ${response.audit_id}`);
```

---

## Telemetry & Race State Types

### `LapPoint`

Single lap telemetry data point.

```typescript
interface LapPoint {
  lap: number;
  lap_time_s?: number | null;
  sector1_s?: number | null;
  sector2_s?: number | null;
  sector3_s?: number | null;
  tyre_wear_pct?: number | null;
  tyre_compound?: string | null;
  fuel_kg?: number | null;
  gap_ahead_s?: number | null;
  gap_behind_s?: number | null;
}
```

### `TelemetryPayload`

Complete session telemetry data.

```typescript
interface TelemetryPayload {
  circuit: string;
  session_label: string;
  driver: string;
  laps: LapPoint[];
}
```

**Example:**
```typescript
const telemetry: TelemetryPayload = {
  circuit: "Monza",
  session_label: "Race",
  driver: "VER",
  laps: [
    { lap: 1, lap_time_s: 82.5, tyre_compound: "SOFT" },
    { lap: 2, lap_time_s: 81.2, tyre_compound: "SOFT", tyre_wear_pct: 5 }
  ]
};
```

### `RaceState`

Complete race state snapshot with positions, weather, and track status.

```typescript
interface RaceState {
  session_id: string;
  current_lap: number;
  total_laps: number;
  elapsed_time_s: number;
  positions: DriverPosition[];
  weather: WeatherCondition;
  track_status: TrackStatus;
  timestamp: string;
}
```

### `DriverPosition`

Individual driver position and status.

```typescript
interface DriverPosition {
  driver_id: string;
  driver_name: string;
  position: number;
  gap_to_leader_s: number;
  gap_to_ahead_s: number;
  tire_compound: string;
  tire_age_laps: number;
  pit_stops: number;
  last_lap_time_s?: number;
}
```

---

## Chat & Commentary Types

### `ChatMessage` & `ChatResponse`

For AI copilot interactions.

```typescript
type ChatRole = 'user' | 'assistant';

interface ChatMessage {
  role: ChatRole;
  content: string;
}

interface ChatResponse {
  reply: string;
}
```

**Example:**
```typescript
const messages: ChatMessage[] = [
  { role: 'user', content: 'Why did we recommend pitting on lap 23?' }
];

const response = await postChat(messages, telemetryContext);
console.log(response.reply);
```

### `DebriefResponse`

Post-race AI-generated debrief.

```typescript
interface DebriefResponse {
  report_markdown: string;
  source_note: string;
}
```

**Example:**
```typescript
const debrief = await uploadDebrief(file);
console.log(debrief.report_markdown); // Markdown formatted report
```

---

## Fan Engagement Types

### `FanPredictRequest` & `FanPredictResponse`

For what-if scenario simulations.

```typescript
interface FanPredictRequest {
  driver: string;
  action: string;
  predict_laps: number;
}

interface FanPredictResponse {
  narrative: string;
  prediction_id?: string;
}
```

**Example:**
```typescript
const prediction = await postFanPredict({
  driver: "VER",
  action: "PIT",
  predict_laps: 5
});

console.log(prediction.narrative);
```

### `WhatIfScenario`

Complete what-if scenario with predicted outcomes.

```typescript
interface WhatIfScenario {
  scenario_id: string;
  driver: string;
  parameters: {
    pit_lap?: number;
    tire_compound?: string;
    fuel_load?: number;
    [key: string]: unknown;
  };
  predicted_outcome: {
    final_position: number;
    time_delta_s: number;
    risk_level: 'low' | 'medium' | 'high';
    narrative: string;
  };
  confidence: number;
  timestamp: string;
}
```

---

## Validation & Type Guards

### Type Guards

Type guards are available for runtime type checking:

```typescript
import { 
  isStrategyRecommendation,
  isChatResponse,
  isRaceState,
  isTelemetryPayload 
} from '@/types/api';

// Example usage
const data: unknown = await fetchData();

if (isStrategyRecommendation(data)) {
  // TypeScript now knows data is StrategyRecommendation
  console.log(data.confidence);
}
```

### Validation Functions

Validators throw errors for invalid data:

```typescript
import { 
  validateStrategyRecommendation,
  validateChatResponse 
} from '@/utils/validators';

try {
  const recommendation = validateStrategyRecommendation(apiResponse);
  // Safe to use recommendation
} catch (error) {
  console.error('Invalid API response:', error);
}
```

### Safe Parsing

Safe parsers return `null` instead of throwing:

```typescript
import { 
  safeParseStrategyRecommendation,
  safeParseChatResponse 
} from '@/utils/validators';

const recommendation = safeParseStrategyRecommendation(apiResponse);
if (recommendation) {
  // Valid recommendation
} else {
  // Handle invalid data
}
```

---

## Usage Examples

### Complete Strategy Flow

```typescript
import { 
  postRecommend, 
  postCommitStrategy,
  type TelemetryPayload,
  type StrategyRecommendation 
} from '@/services/api';
import { validateStrategyRecommendation } from '@/utils/validators';

async function getStrategyRecommendation() {
  // 1. Prepare telemetry
  const telemetry: TelemetryPayload = {
    circuit: "Monza",
    session_label: "Race",
    driver: "VER",
    laps: [/* lap data */]
  };

  // 2. Get recommendation
  const recommendation = await postRecommend(telemetry);
  
  // 3. Validate (optional but recommended)
  validateStrategyRecommendation(recommendation);
  
  // 4. Use recommendation
  console.log(`Action: ${recommendation.action}`);
  console.log(`Confidence: ${recommendation.confidence}%`);
  
  // 5. Commit if approved
  if (recommendation.confidence > 70) {
    const response = await postCommitStrategy({
      recommendation,
      checklist: {
        pit_crew_ready: true,
        tyre_set_confirmed: true,
        radio_call_prepared: true
      },
      execution_brief: recommendation.action
    });
    
    console.log(`Committed: ${response.audit_id}`);
  }
}
```

### Chat with Context

```typescript
import { postChat, type ChatMessage } from '@/services/api';

async function askCopilot(question: string, telemetry: TelemetryPayload) {
  const messages: ChatMessage[] = [
    { role: 'user', content: question }
  ];
  
  const response = await postChat(messages, telemetry);
  return response.reply;
}

// Usage
const answer = await askCopilot(
  "Why did we recommend pitting on lap 23?",
  currentTelemetry
);
```

### Fan Mode Prediction

```typescript
import { postFanPredict } from '@/services/api';

async function simulateStrategy() {
  const prediction = await postFanPredict({
    driver: "VER",
    action: "PIT",
    predict_laps: 5
  });
  
  console.log(prediction.narrative);
}
```

---

## Migration Guide

### From `any` Types

**Before:**
```typescript
async function getData(): Promise<any> {
  const res = await fetch('/api/strategy/recommend');
  return res.json();
}
```

**After:**
```typescript
import { type StrategyRecommendation } from '@/services/api';

async function getData(): Promise<StrategyRecommendation> {
  const res = await fetch('/api/strategy/recommend');
  return res.json();
}
```

### From Inline Types

**Before:**
```typescript
interface Props {
  recommendation: {
    action: string;
    confidence: number;
    // ... other fields
  };
}
```

**After:**
```typescript
import { type StrategyRecommendation } from '@/services/api';

interface Props {
  recommendation: StrategyRecommendation;
}
```

### Adding Runtime Validation

**Before:**
```typescript
const data = await api.getData();
// Hope it's valid!
```

**After:**
```typescript
import { validateStrategyRecommendation } from '@/utils/validators';

const data = await api.getData();
const validated = validateStrategyRecommendation(data);
// Now guaranteed to be valid
```

---

## Best Practices

1. **Always import types from `@/services/api`** for convenience (they're re-exported)
2. **Use type guards** when dealing with unknown data from external sources
3. **Add runtime validation** for critical API responses
4. **Prefer specific types** over `any` or `unknown`
5. **Use JSDoc comments** to document complex type usage in your components
6. **Keep types in sync** with backend Pydantic models

---

## Type Safety Checklist

- [ ] All API functions have proper return types
- [ ] No `any` types in API-related code
- [ ] Runtime validation for external data
- [ ] Type guards for conditional logic
- [ ] Proper error handling with typed errors
- [ ] JSDoc comments for complex types
- [ ] Tests verify type correctness

---

## Additional Resources

- **Backend Models**: `backend/models/` - Pydantic models that define the API contract
- **API Routes**: `backend/routes/` - FastAPI endpoints
- **Type Tests**: `frontend/src/lib/utils.test.ts` - Example type tests

---

## Support

For questions or issues with types:
1. Check this documentation
2. Review `frontend/src/types/api.ts` for type definitions
3. Check `frontend/src/utils/validators.ts` for validation functions
4. Consult backend Pydantic models for source of truth

---

**Last Updated**: 2026-05-20  
**Version**: 1.0.0