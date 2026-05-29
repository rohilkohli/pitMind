import { describe, expect, it } from "vitest";
import { encodeDashboardState } from "./useDashboardState";
import type { DashboardState } from "./useDashboardState";

describe("encodeDashboardState", () => {
  it("returns empty string for empty state", () => {
    expect(encodeDashboardState({})).toBe("");
  });

  it("encodes driverFilter", () => {
    const state: DashboardState = { driverFilter: "VER" };
    expect(encodeDashboardState(state)).toBe("?driver=VER");
  });

  it("encodes lapRange", () => {
    const state: DashboardState = { lapRange: [1, 50] };
    expect(encodeDashboardState(state)).toBe("?laps=1-50");
  });

  it("encodes strategyFilters.minConfidence", () => {
    const state: DashboardState = { strategyFilters: { minConfidence: 0.8 } };
    expect(encodeDashboardState(state)).toBe("?minConf=0.8");
  });

  it("encodes strategyFilters.showAlternatives", () => {
    const state: DashboardState = { strategyFilters: { showAlternatives: true } };
    expect(encodeDashboardState(state)).toBe("?showAlt=true");

    const stateFalse: DashboardState = { strategyFilters: { showAlternatives: false } };
    expect(encodeDashboardState(stateFalse)).toBe("?showAlt=false");
  });

  it("encodes strategyFilters.compoundFilter", () => {
    const state: DashboardState = { strategyFilters: { compoundFilter: ["SOFT", "MEDIUM"] } };
    // URLSearchParams encodes commas as %2C
    expect(encodeDashboardState(state)).toBe("?compounds=SOFT%2CMEDIUM");
  });

  it("handles empty strategyFilters.compoundFilter correctly", () => {
    const state: DashboardState = { strategyFilters: { compoundFilter: [] } };
    expect(encodeDashboardState(state)).toBe("");
  });

  it("encodes selectedMetrics", () => {
    const state: DashboardState = { selectedMetrics: ["lapTime", "speed"] };
    // URLSearchParams encodes commas as %2C
    expect(encodeDashboardState(state)).toBe("?metrics=lapTime%2Cspeed");
  });

  it("handles empty selectedMetrics correctly", () => {
    const state: DashboardState = { selectedMetrics: [] };
    expect(encodeDashboardState(state)).toBe("");
  });

  it("encodes timeFilter", () => {
    const state: DashboardState = { timeFilter: "live" };
    expect(encodeDashboardState(state)).toBe("?time=live");
  });

  it("encodes multiple state properties together", () => {
    const state: DashboardState = {
      driverFilter: "HAM",
      lapRange: [10, 20],
      strategyFilters: {
        minConfidence: 0.9,
        showAlternatives: false,
        compoundFilter: ["HARD"],
      },
      selectedMetrics: ["lapTime"],
      timeFilter: "last_10",
    };

    const encoded = encodeDashboardState(state);

    // We can test individual params since the order might vary depending on URLSearchParams implementation
    // Though it usually preserves insertion order
    expect(encoded).toContain("driver=HAM");
    expect(encoded).toContain("laps=10-20");
    expect(encoded).toContain("minConf=0.9");
    expect(encoded).toContain("showAlt=false");
    expect(encoded).toContain("compounds=HARD");
    expect(encoded).toContain("metrics=lapTime");
    expect(encoded).toContain("time=last_10");
    expect(encoded.startsWith("?")).toBe(true);
  });
});
