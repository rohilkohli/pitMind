import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { postRecommend } from "./api";
import type { TelemetryPayload, StrategyRecommendation } from "../types/api";

describe("postRecommend", () => {
  const mockPayload: TelemetryPayload = {
    circuit: "Monza",
    session_label: "Race",
    driver: "VER",
    laps: [],
  };

  const mockResponse: StrategyRecommendation = {
    action: "Pit",
    pit_this_lap: true,
    suggested_compound: "HARD",
    scores: {
      pit_urgency: 80,
      sc_probability_next_3_laps: 20,
      overtake_risk: 50,
      recommended_window_laps: [20, 25],
    },
    structured_reasons: ["Tire wear is high"],
    explanation: "Pit now for hard tires",
    evidence: ["Lap time dropping"],
    assumptions: ["No safety car"],
    confidence: 80,
    alternative: "Stay out",
    pipeline_steps: [],
  };

  // Keep a reference to the original fetch
  const originalFetch = global.fetch;

  beforeEach(() => {
    // Mock global fetch
    global.fetch = vi.fn();
  });

  afterEach(() => {
    // Restore fetch after each test
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("should successfully post telemetry payload and return a recommendation", async () => {
    // Setup mock response
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await postRecommend(mockPayload);

    // Verify fetch was called with correct parameters
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/strategy/recommend"),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(mockPayload),
      },
    );

    // Verify result matches mock response
    expect(result).toEqual(mockResponse);
  });

  it("should include the auth token in headers if provided", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const token = "fake-auth-token";
    await postRecommend(mockPayload, token);

    // Verify auth token was included in headers
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/strategy/recommend"),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(mockPayload),
      },
    );
  });

  it("should throw an error if the API request fails", async () => {
    const errorMsg = "Internal Server Error";
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: errorMsg,
      text: async () => errorMsg,
    });

    // Verify that the function throws the expected error
    await expect(postRecommend(mockPayload)).rejects.toThrow(errorMsg);

    // Verify fetch was called
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("should throw a fallback error if text body is empty on failure", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
      text: async () => "",
    });

    // Verify that the function throws the fallback error
    await expect(postRecommend(mockPayload)).rejects.toThrow("HTTP 404: Not Found");
  });
});
