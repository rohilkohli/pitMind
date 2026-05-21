/**
 * Runtime Type Validators for API Responses
 * 
 * This module provides runtime validation functions and type guards to ensure
 * API responses match expected TypeScript types. This adds an extra layer of
 * safety beyond compile-time type checking.
 * 
 * @module utils/validators
 */

import type {
  StrategyRecommendation,
  StrategyScores,
  ConfidenceDecomposition,
  ChatResponse,
  DebriefResponse,
  TelemetryPayload,
  LapPoint,
  RaceState,
  DriverPosition,
  WeatherCondition,
  TrackStatus,
  FanPredictResponse,
  AuditLogEntry,
} from '../types/api';

// ============================================================================
// Type Guard Functions
// ============================================================================

/**
 * Type guard for LapPoint
 */
export function isLapPoint(value: unknown): value is LapPoint {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  
  return (
    typeof obj.lap === 'number' &&
    (obj.lap_time_s === undefined || obj.lap_time_s === null || typeof obj.lap_time_s === 'number') &&
    (obj.sector1_s === undefined || obj.sector1_s === null || typeof obj.sector1_s === 'number') &&
    (obj.sector2_s === undefined || obj.sector2_s === null || typeof obj.sector2_s === 'number') &&
    (obj.sector3_s === undefined || obj.sector3_s === null || typeof obj.sector3_s === 'number') &&
    (obj.tyre_wear_pct === undefined || obj.tyre_wear_pct === null || typeof obj.tyre_wear_pct === 'number') &&
    (obj.tyre_compound === undefined || obj.tyre_compound === null || typeof obj.tyre_compound === 'string') &&
    (obj.fuel_kg === undefined || obj.fuel_kg === null || typeof obj.fuel_kg === 'number')
  );
}

/**
 * Type guard for TelemetryPayload
 */
export function isTelemetryPayload(value: unknown): value is TelemetryPayload {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  
  return (
    typeof obj.circuit === 'string' &&
    typeof obj.session_label === 'string' &&
    typeof obj.driver === 'string' &&
    Array.isArray(obj.laps) &&
    obj.laps.every(isLapPoint)
  );
}

/**
 * Type guard for StrategyScores
 */
export function isStrategyScores(value: unknown): value is StrategyScores {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  
  return (
    typeof obj.pit_urgency === 'number' &&
    typeof obj.sc_probability_next_3_laps === 'number' &&
    typeof obj.overtake_risk === 'number' &&
    Array.isArray(obj.recommended_window_laps) &&
    obj.recommended_window_laps.length === 2 &&
    typeof obj.recommended_window_laps[0] === 'number' &&
    typeof obj.recommended_window_laps[1] === 'number'
  );
}

/**
 * Type guard for ConfidenceDecomposition
 */
export function isConfidenceDecomposition(value: unknown): value is ConfidenceDecomposition {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  
  return (
    typeof obj.data_quality === 'number' &&
    typeof obj.model_certainty === 'number' &&
    typeof obj.stability === 'number' &&
    typeof obj.regret_bound === 'number'
  );
}

/**
 * Type guard for StrategyRecommendation
 */
export function isStrategyRecommendation(value: unknown): value is StrategyRecommendation {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  
  return (
    typeof obj.action === 'string' &&
    typeof obj.pit_this_lap === 'boolean' &&
    typeof obj.suggested_compound === 'string' &&
    isStrategyScores(obj.scores) &&
    Array.isArray(obj.structured_reasons) &&
    obj.structured_reasons.every((r: unknown) => typeof r === 'string') &&
    typeof obj.explanation === 'string' &&
    Array.isArray(obj.evidence) &&
    obj.evidence.every((e: unknown) => typeof e === 'string') &&
    Array.isArray(obj.assumptions) &&
    obj.assumptions.every((a: unknown) => typeof a === 'string') &&
    typeof obj.confidence === 'number' &&
    typeof obj.alternative === 'string' &&
    Array.isArray(obj.pipeline_steps) &&
    obj.pipeline_steps.every((s: unknown) => typeof s === 'string') &&
    (obj.confidence_decomposition === undefined || 
     obj.confidence_decomposition === null || 
     isConfidenceDecomposition(obj.confidence_decomposition))
  );
}

/**
 * Type guard for ChatResponse
 */
export function isChatResponse(value: unknown): value is ChatResponse {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  
  return typeof obj.reply === 'string';
}

/**
 * Type guard for DebriefResponse
 */
export function isDebriefResponse(value: unknown): value is DebriefResponse {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  
  return (
    typeof obj.report_markdown === 'string' &&
    typeof obj.source_note === 'string'
  );
}

/**
 * Type guard for DriverPosition
 */
export function isDriverPosition(value: unknown): value is DriverPosition {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  
  return (
    typeof obj.driver_id === 'string' &&
    typeof obj.driver_name === 'string' &&
    typeof obj.position === 'number' &&
    typeof obj.gap_to_leader_s === 'number' &&
    typeof obj.gap_to_ahead_s === 'number' &&
    typeof obj.tire_compound === 'string' &&
    typeof obj.tire_age_laps === 'number' &&
    typeof obj.pit_stops === 'number'
  );
}

/**
 * Type guard for WeatherCondition
 */
export function isWeatherCondition(value: unknown): value is WeatherCondition {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  
  return (
    typeof obj.air_temperature_c === 'number' &&
    typeof obj.track_temperature_c === 'number' &&
    typeof obj.humidity_pct === 'number' &&
    typeof obj.rain_probability_pct === 'number' &&
    typeof obj.wind_speed_kmh === 'number' &&
    typeof obj.wind_direction_deg === 'number'
  );
}

/**
 * Type guard for TrackStatus
 */
export function isTrackStatus(value: unknown): value is TrackStatus {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  
  const validFlags = ['green', 'yellow', 'red', 'safety_car', 'virtual_safety_car'];
  
  return (
    typeof obj.flag === 'string' &&
    validFlags.includes(obj.flag) &&
    typeof obj.safety_car_deployed === 'boolean' &&
    typeof obj.virtual_safety_car === 'boolean' &&
    typeof obj.red_flag === 'boolean'
  );
}

/**
 * Type guard for RaceState
 */
export function isRaceState(value: unknown): value is RaceState {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  
  return (
    typeof obj.session_id === 'string' &&
    typeof obj.current_lap === 'number' &&
    typeof obj.total_laps === 'number' &&
    typeof obj.elapsed_time_s === 'number' &&
    Array.isArray(obj.positions) &&
    obj.positions.every(isDriverPosition) &&
    isWeatherCondition(obj.weather) &&
    isTrackStatus(obj.track_status) &&
    typeof obj.timestamp === 'string'
  );
}

/**
 * Type guard for FanPredictResponse
 */
export function isFanPredictResponse(value: unknown): value is FanPredictResponse {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  
  return typeof obj.narrative === 'string';
}

/**
 * Type guard for AuditLogEntry
 */
export function isAuditLogEntry(value: unknown): value is AuditLogEntry {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  
  return (
    typeof obj.id === 'string' &&
    typeof obj.timestamp === 'string' &&
    typeof obj.session_id === 'string' &&
    typeof obj.driver === 'string' &&
    typeof obj.lap === 'number' &&
    typeof obj.strategy_type === 'string' &&
    typeof obj.confidence === 'number' &&
    typeof obj.reasoning === 'string'
  );
}

// ============================================================================
// Validation Functions with Error Handling
// ============================================================================

/**
 * Validates and returns a StrategyRecommendation, throwing an error if invalid
 */
export function validateStrategyRecommendation(data: unknown): StrategyRecommendation {
  if (!isStrategyRecommendation(data)) {
    console.error('Invalid StrategyRecommendation:', data);
    throw new Error('Invalid StrategyRecommendation response from API');
  }
  return data;
}

/**
 * Validates and returns a ChatResponse, throwing an error if invalid
 */
export function validateChatResponse(data: unknown): ChatResponse {
  if (!isChatResponse(data)) {
    console.error('Invalid ChatResponse:', data);
    throw new Error('Invalid ChatResponse from API');
  }
  return data;
}

/**
 * Validates and returns a TelemetryPayload, throwing an error if invalid
 */
export function validateTelemetryPayload(data: unknown): TelemetryPayload {
  if (!isTelemetryPayload(data)) {
    console.error('Invalid TelemetryPayload:', data);
    throw new Error('Invalid TelemetryPayload from API');
  }
  return data;
}

/**
 * Validates and returns a RaceState, throwing an error if invalid
 */
export function validateRaceState(data: unknown): RaceState {
  if (!isRaceState(data)) {
    console.error('Invalid RaceState:', data);
    throw new Error('Invalid RaceState from API');
  }
  return data;
}

/**
 * Validates and returns a DebriefResponse, throwing an error if invalid
 */
export function validateDebriefResponse(data: unknown): DebriefResponse {
  if (!isDebriefResponse(data)) {
    console.error('Invalid DebriefResponse:', data);
    throw new Error('Invalid DebriefResponse from API');
  }
  return data;
}

// ============================================================================
// Safe Parsing Functions (returns null on failure)
// ============================================================================

/**
 * Safely parses a StrategyRecommendation, returning null if invalid
 */
export function safeParseStrategyRecommendation(data: unknown): StrategyRecommendation | null {
  try {
    return validateStrategyRecommendation(data);
  } catch {
    return null;
  }
}

/**
 * Safely parses a ChatResponse, returning null if invalid
 */
export function safeParseChatResponse(data: unknown): ChatResponse | null {
  try {
    return validateChatResponse(data);
  } catch {
    return null;
  }
}

/**
 * Safely parses a TelemetryPayload, returning null if invalid
 */
export function safeParseTelemetryPayload(data: unknown): TelemetryPayload | null {
  try {
    return validateTelemetryPayload(data);
  } catch {
    return null;
  }
}

/**
 * Safely parses a RaceState, returning null if invalid
 */
export function safeParseRaceState(data: unknown): RaceState | null {
  try {
    return validateRaceState(data);
  } catch {
    return null;
  }
}

/**
 * Safely parses a DebriefResponse, returning null if invalid
 */
export function safeParseDebriefResponse(data: unknown): DebriefResponse | null {
  try {
    return validateDebriefResponse(data);
  } catch {
    return null;
  }
}

// Made with Bob
