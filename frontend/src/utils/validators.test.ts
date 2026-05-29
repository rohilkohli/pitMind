import { describe, expect, it } from "vitest";
import { safeParseStrategyRecommendation, isAuditLogEntry } from "./validators";
import type { AuditLogEntry } from "../types/api";

describe("safeParseStrategyRecommendation", () => {
  const validScores = {
    pit_urgency: 0.8,
    sc_probability_next_3_laps: 0.2,
    overtake_risk: 0.5,
    recommended_window_laps: [15, 20],
  };

  const validRecommendation = {
    action: "PIT",
    pit_this_lap: true,
    suggested_compound: "MEDIUM",
    scores: validScores,
    structured_reasons: ["Tire wear is high", "Pit window open"],
    explanation: "You should pit now because tire wear is high.",
    evidence: ["Telemetry data shows 80% wear"],
    assumptions: ["No safety car in next 5 laps"],
    confidence: 0.85,
    alternative: "STAY_OUT",
    pipeline_steps: ["Step 1", "Step 2"],
    confidence_decomposition: {
      data_quality: 0.9,
      model_certainty: 0.8,
      stability: 0.85,
      regret_bound: 0.1,
    },
  };

  it("should return the object for a fully valid StrategyRecommendation", () => {
    const result = safeParseStrategyRecommendation(validRecommendation);
    expect(result).toEqual(validRecommendation);
  });

  it("should return the object when confidence_decomposition is omitted", () => {
    const recommendationWithoutDecomposition = { ...validRecommendation };
    delete (recommendationWithoutDecomposition as any).confidence_decomposition;

    const result = safeParseStrategyRecommendation(recommendationWithoutDecomposition);
    expect(result).toEqual(recommendationWithoutDecomposition);
  });

  it("should return the object when confidence_decomposition is null", () => {
    const recommendationWithNullDecomposition = {
      ...validRecommendation,
      confidence_decomposition: null,
    };

    const result = safeParseStrategyRecommendation(recommendationWithNullDecomposition);
    expect(result).toEqual(recommendationWithNullDecomposition);
  });

  it("should return null for completely invalid inputs", () => {
    expect(safeParseStrategyRecommendation(null)).toBeNull();
    expect(safeParseStrategyRecommendation(undefined)).toBeNull();
    expect(safeParseStrategyRecommendation("string")).toBeNull();
    expect(safeParseStrategyRecommendation(123)).toBeNull();
    expect(safeParseStrategyRecommendation({})).toBeNull();
    expect(safeParseStrategyRecommendation([])).toBeNull();
  });

  it("should return null when a required field is missing", () => {
    const missingAction = { ...validRecommendation };
    delete (missingAction as any).action;
    expect(safeParseStrategyRecommendation(missingAction)).toBeNull();
  });

  it("should return null when a field has the wrong type", () => {
    const wrongType = { ...validRecommendation, confidence: "high" };
    expect(safeParseStrategyRecommendation(wrongType)).toBeNull();
  });

  it("should return null when nested object has missing fields (scores)", () => {
    const invalidScores = { ...validScores };
    delete (invalidScores as any).pit_urgency;
    const invalidNested = { ...validRecommendation, scores: invalidScores };
    expect(safeParseStrategyRecommendation(invalidNested)).toBeNull();
  });

  it("should return null when arrays contain wrong types", () => {
    const wrongArrayType = { ...validRecommendation, structured_reasons: ["Reason 1", 123] };
    expect(safeParseStrategyRecommendation(wrongArrayType)).toBeNull();
  });
});

describe("isAuditLogEntry", () => {
  it("should return true for a valid AuditLogEntry", () => {
    const validEntry: AuditLogEntry = {
      id: "log-123",
      timestamp: "2023-10-27T10:00:00Z",
      session_id: "session-456",
      driver: "VER",
      lap: 42,
      strategy_type: "pit_stop",
      confidence: 0.85,
      reasoning: "Tire degradation is high.",
    };

    expect(isAuditLogEntry(validEntry)).toBe(true);
  });

  it("should return false for null", () => {
    expect(isAuditLogEntry(null)).toBe(false);
  });

  it("should return false for undefined", () => {
    expect(isAuditLogEntry(undefined)).toBe(false);
  });

  it("should return false for primitive values", () => {
    expect(isAuditLogEntry("string")).toBe(false);
    expect(isAuditLogEntry(123)).toBe(false);
    expect(isAuditLogEntry(true)).toBe(false);
  });

  it("should return false if missing required properties", () => {
    const missingId = {
      timestamp: "2023-10-27T10:00:00Z",
      session_id: "session-456",
      driver: "VER",
      lap: 42,
      strategy_type: "pit_stop",
      confidence: 0.85,
      reasoning: "Tire degradation is high.",
    };
    expect(isAuditLogEntry(missingId)).toBe(false);

    const missingReasoning = {
      id: "log-123",
      timestamp: "2023-10-27T10:00:00Z",
      session_id: "session-456",
      driver: "VER",
      lap: 42,
      strategy_type: "pit_stop",
      confidence: 0.85,
    };
    expect(isAuditLogEntry(missingReasoning)).toBe(false);
  });

  it("should return false if properties have incorrect types", () => {
    const wrongIdType = {
      id: 123, // Should be string
      timestamp: "2023-10-27T10:00:00Z",
      session_id: "session-456",
      driver: "VER",
      lap: 42,
      strategy_type: "pit_stop",
      confidence: 0.85,
      reasoning: "Tire degradation is high.",
    };
    expect(isAuditLogEntry(wrongIdType)).toBe(false);

    const wrongLapType = {
      id: "log-123",
      timestamp: "2023-10-27T10:00:00Z",
      session_id: "session-456",
      driver: "VER",
      lap: "42", // Should be number
      strategy_type: "pit_stop",
      confidence: 0.85,
      reasoning: "Tire degradation is high.",
    };
    expect(isAuditLogEntry(wrongLapType)).toBe(false);
  });

  it("should return true even if there are extra properties", () => {
    const extraProps = {
      id: "log-123",
      timestamp: "2023-10-27T10:00:00Z",
      session_id: "session-456",
      driver: "VER",
      lap: 42,
      strategy_type: "pit_stop",
      confidence: 0.85,
      reasoning: "Tire degradation is high.",
      extra_prop: "some value",
    };
    expect(isAuditLogEntry(extraProps)).toBe(true);
  });
});
