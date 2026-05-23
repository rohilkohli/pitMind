import { describe, expect, it } from "vitest";
import { safeParseStrategyRecommendation } from "./validators";
import type { StrategyRecommendation } from "../types/api";

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
    }
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
      confidence_decomposition: null
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
