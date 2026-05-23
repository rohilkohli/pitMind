/**
 * API Response Types for PitMind Frontend
 *
 * This file contains TypeScript interfaces that match the backend Pydantic models
 * to ensure type safety across the application. All types are derived from the
 * backend API contract.
 *
 * @module types/api
 */

// ============================================================================
// Base Response Types
// ============================================================================

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

/**
 * API error response structure
 */
export interface ApiError {
  detail: string;
  status?: number;
  code?: string;
}

// ============================================================================
// Telemetry & Race State Types
// ============================================================================

/**
 * Single lap telemetry data point
 * Matches backend LapPoint model
 */
export interface LapPoint {
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

/**
 * Complete telemetry payload for a session
 * Matches backend TelemetryPayload model
 */
export interface TelemetryPayload {
  circuit: string;
  session_label: string;
  driver: string;
  laps: LapPoint[];
}

/**
 * Driver position in race
 */
export interface DriverPosition {
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

/**
 * Weather conditions
 */
export interface WeatherCondition {
  air_temperature_c: number;
  track_temperature_c: number;
  humidity_pct: number;
  rain_probability_pct: number;
  wind_speed_kmh: number;
  wind_direction_deg: number;
}

/**
 * Track status flags
 */
export type TrackStatusFlag = "green" | "yellow" | "red" | "safety_car" | "virtual_safety_car";

/**
 * Track status information
 */
export interface TrackStatus {
  flag: TrackStatusFlag;
  safety_car_deployed: boolean;
  virtual_safety_car: boolean;
  red_flag: boolean;
  message?: string;
}

/**
 * Complete race state snapshot
 */
export interface RaceState {
  session_id: string;
  current_lap: number;
  total_laps: number;
  elapsed_time_s: number;
  positions: DriverPosition[];
  weather: WeatherCondition;
  track_status: TrackStatus;
  timestamp: string;
}

// ============================================================================
// Strategy Types
// ============================================================================

/**
 * Strategy risk and opportunity scores
 * Matches backend StrategyScores model
 */
export interface StrategyScores {
  pit_urgency: number; // 0-100
  sc_probability_next_3_laps: number; // 0-100
  overtake_risk: number; // 0-100
  recommended_window_laps: [number, number];
}

/**
 * Confidence breakdown for strategy recommendation
 * Matches backend ConfidenceDecomposition model
 */
export interface ConfidenceDecomposition {
  data_quality: number; // 0-100: % completeness and reliability of telemetry inputs
  model_certainty: number; // 0-100: confidence in model predictions
  stability: number; // 0-100: consistency across similar scenarios
  regret_bound: number; // 0-1: max expected loss vs optimal (lower is better)
}

/**
 * Complete strategy recommendation from AI pipeline
 * Matches backend StrategyRecommendation model
 */
export interface StrategyRecommendation {
  action: string;
  pit_this_lap: boolean;
  suggested_compound: string;
  scores: StrategyScores;
  structured_reasons: string[];
  explanation: string;
  evidence: string[];
  assumptions: string[];
  confidence: number; // 0-100
  alternative: string;
  pipeline_steps: string[];
  confidence_decomposition?: ConfidenceDecomposition;
  urgency_score?: number;
  model_used?: string | null;
  explanation_source?: string | null;
}

/**
 * Strategy execution checklist
 * Matches backend StrategyChecklist model
 */
export interface StrategyChecklist {
  pit_crew_ready: boolean;
  tyre_set_confirmed: boolean;
  radio_call_prepared: boolean;
}

/**
 * Strategy commit request payload
 * Matches backend StrategyCommitRequest model
 */
export interface StrategyCommitRequest {
  recommendation: StrategyRecommendation;
  checklist: StrategyChecklist;
  execution_brief: string;
  session_context?: Record<string, unknown>;
}

/**
 * Strategy commit response
 * Matches backend StrategyCommitResponse model
 */
export interface StrategyCommitResponse {
  audit_id: string;
  status: string;
  message: string;
  committed_at: string;
}

/**
 * Driver comparison request
 * Matches backend DriverCompareRequest model
 */
export interface DriverCompareRequest {
  driver_a: TelemetryPayload;
  driver_b: TelemetryPayload;
}

/**
 * Driver comparison response
 * Matches backend DriverCompareResponse model
 */
export interface DriverCompareResponse {
  chart_series: Record<string, unknown>;
  narrative: string;
}

// ============================================================================
// Chat & Commentary Types
// ============================================================================

/**
 * Chat message role
 */
export type ChatRole = "user" | "assistant";

/**
 * Single chat message
 * Matches backend ChatMessage model
 */
export interface ChatMessage {
  role: ChatRole;
  content: string;
}

/**
 * Chat request payload
 * Matches backend ChatRequest model
 */
export interface ChatRequest {
  messages: ChatMessage[];
  telemetry_context?: Record<string, unknown> | null;
}

/**
 * Chat response from AI
 * Matches backend ChatResponse model
 */
export interface ChatResponse {
  reply: string;
}

/**
 * Post-race debrief response
 * Matches backend DebriefResponse model
 */
export interface DebriefResponse {
  report_markdown: string;
  source_note: string;
}

/**
 * Commentary response for live race
 */
export interface CommentaryResponse {
  commentary: string;
  context: string;
  timestamp: string;
  lap?: number;
}

// ============================================================================
// Fan Engagement Types
// ============================================================================

/**
 * Fan prediction submission
 */
export interface FanPrediction {
  prediction_id: string;
  driver: string;
  action: string;
  predict_laps: number;
  confidence?: number;
  timestamp: string;
}

/**
 * Fan prediction request
 */
export interface FanPredictRequest {
  driver: string;
  action: string;
  predict_laps: number;
}

/**
 * Fan prediction response
 */
export interface FanPredictResponse {
  narrative: string;
  prediction_id?: string;
  model?: string;
  confidence?: number | null;
}

/**
 * Fan battle between drivers
 */
export interface FanBattle {
  battle_id: string;
  driver_a: string;
  driver_b: string;
  votes_a: number;
  votes_b: number;
  status: "active" | "completed";
  winner?: string;
  created_at: string;
}

/**
 * What-if scenario simulation
 */
export interface WhatIfScenario {
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
    risk_level: "low" | "medium" | "high";
    narrative: string;
  };
  confidence: number;
  timestamp: string;
}

/**
 * Fan status response
 */
export interface FanStatusResponse {
  mode: string;
  active_session: boolean;
}

// ============================================================================
// FastF1 Integration Types
// ============================================================================

/**
 * FastF1 session type
 */
export type FastF1SessionType = "R" | "Q" | "S" | "FP1" | "FP2" | "FP3";

/**
 * FastF1 data request
 * Matches backend FastF1Request model
 */
export interface FastF1Request {
  year: number;
  event: string;
  session_type: FastF1SessionType;
  driver_code: string;
}

// ============================================================================
// Audit & History Types
// ============================================================================

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  id: string;
  timestamp: string;
  session_id: string;
  driver: string;
  lap: number;
  strategy_type: string;
  confidence: number;
  reasoning: string;
  telemetry_snapshot?: TelemetryPayload | null;
  metadata?: Record<string, unknown>;
}

/**
 * Audit history response with pagination
 */
export interface AuditHistoryResponse {
  total: number;
  limit: number;
  offset: number;
  records: AuditLogEntry[];
  source?: string;
}

/**
 * Audit history query parameters
 */
export interface AuditHistoryParams {
  session_id?: string;
  driver?: string;
  limit?: number;
  offset?: number;
}

// ============================================================================
// WebSocket/Stream Types
// ============================================================================

/**
 * WebSocket message types
 */
export type WebSocketMessageType =
  | "telemetry_update"
  | "strategy_update"
  | "race_state_update"
  | "commentary"
  | "error"
  | "ping"
  | "pong";

/**
 * WebSocket message structure
 */
export interface WebSocketMessage<T = unknown> {
  type: WebSocketMessageType;
  data: T;
  timestamp: string;
  session_id?: string;
}

/**
 * Stream health status
 */
export interface StreamHealthStatus {
  connected: boolean;
  latency_ms: number;
  last_message_at: string;
  reconnect_count: number;
  error?: string;
}

// ============================================================================
// Type Guards & Utilities
// ============================================================================

/**
 * Type guard to check if a value is an ApiError
 */
export function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === "object" &&
    value !== null &&
    "detail" in value &&
    typeof (value as ApiError).detail === "string"
  );
}

/**
 * Type guard to check if a value is a StrategyRecommendation
 */
export function isStrategyRecommendation(value: unknown): value is StrategyRecommendation {
  return (
    typeof value === "object" &&
    value !== null &&
    "action" in value &&
    "pit_this_lap" in value &&
    "suggested_compound" in value &&
    "scores" in value &&
    "confidence" in value
  );
}

/**
 * Type guard to check if a value is a ChatResponse
 */
export function isChatResponse(value: unknown): value is ChatResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "reply" in value &&
    typeof (value as ChatResponse).reply === "string"
  );
}

/**
 * Type guard to check if a value is a RaceState
 */
export function isRaceState(value: unknown): value is RaceState {
  return (
    typeof value === "object" &&
    value !== null &&
    "session_id" in value &&
    "current_lap" in value &&
    "positions" in value &&
    Array.isArray((value as RaceState).positions)
  );
}

// Made with Bob
