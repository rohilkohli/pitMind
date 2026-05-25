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
} from "../types/api";

// ============================================================================
// Type Guard Functions
// ============================================================================


/**
 * Type guard for StrategyScores
 */
export function isStrategyScores(value: unknown): value is StrategyScores {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;

  return (
    typeof obj.pit_urgency === "number" &&
    typeof obj.sc_probability_next_3_laps === "number" &&
    typeof obj.overtake_risk === "number" &&
    Array.isArray(obj.recommended_window_laps) &&
    obj.recommended_window_laps.length === 2 &&
    typeof obj.recommended_window_laps[0] === "number" &&
    typeof obj.recommended_window_laps[1] === "number"
  );
}

/**
 * Type guard for ConfidenceDecomposition
 */
export function isConfidenceDecomposition(value: unknown): value is ConfidenceDecomposition {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;

  return (
    typeof obj.data_quality === "number" &&
    typeof obj.model_certainty === "number" &&
    typeof obj.stability === "number" &&
    typeof obj.regret_bound === "number"
  );
}

/**
 * Type guard for StrategyRecommendation
 */
export function isStrategyRecommendation(value: unknown): value is StrategyRecommendation {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;

  return (
    typeof obj.action === "string" &&
    typeof obj.pit_this_lap === "boolean" &&
    typeof obj.suggested_compound === "string" &&
    isStrategyScores(obj.scores) &&
    Array.isArray(obj.structured_reasons) &&
    obj.structured_reasons.every((r: unknown) => typeof r === "string") &&
    typeof obj.explanation === "string" &&
    Array.isArray(obj.evidence) &&
    obj.evidence.every((e: unknown) => typeof e === "string") &&
    Array.isArray(obj.assumptions) &&
    obj.assumptions.every((a: unknown) => typeof a === "string") &&
    typeof obj.confidence === "number" &&
    typeof obj.alternative === "string" &&
    Array.isArray(obj.pipeline_steps) &&
    obj.pipeline_steps.every((s: unknown) => typeof s === "string") &&
    (obj.confidence_decomposition === undefined ||
      obj.confidence_decomposition === null ||
      isConfidenceDecomposition(obj.confidence_decomposition))
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
    console.error("Invalid StrategyRecommendation:", data);
    throw new Error("Invalid StrategyRecommendation response from API");
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


// Made with Bob
