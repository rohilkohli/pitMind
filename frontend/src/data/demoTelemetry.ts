import type { TelemetryPayload } from "@/services/api";

export const demoDriverA: TelemetryPayload = {
  circuit: "Monza",
  session_label: "Race",
  driver: "Driver A",
  laps: Array.from({ length: 24 }).map((_, i) => {
    const lap = i + 1;
    const base = 81.2 + lap * 0.045;
    return {
      lap,
      lap_time_s: base + (lap > 18 ? 0.35 : 0),
      sector1_s: base / 3 - 0.1,
      sector2_s: base / 3,
      sector3_s: base / 3 + 0.1,
      tyre_wear_pct: Math.min(96, 42 + lap * 2.1),
      tyre_compound: lap < 14 ? "SOFT" : "MEDIUM",
      fuel_kg: 110 - lap * 2.1,
      gap_ahead_s: 1.05 + Math.sin(lap / 3) * 0.12,
      gap_behind_s: 1.35 - lap * 0.01,
    };
  }),
};

export const demoDriverB: TelemetryPayload = {
  circuit: "Monza",
  session_label: "Race",
  driver: "Driver B",
  laps: Array.from({ length: 24 }).map((_, i) => {
    const lap = i + 1;
    const base = 81.35 + lap * 0.035;
    return {
      lap,
      lap_time_s: base,
      sector1_s: base / 3,
      sector2_s: base / 3,
      sector3_s: base / 3,
      tyre_wear_pct: Math.min(94, 38 + lap * 1.9),
      tyre_compound: "MEDIUM",
      fuel_kg: 108 - lap * 2.0,
      gap_ahead_s: 1.2 + Math.cos(lap / 2.5) * 0.08,
      gap_behind_s: 1.5 - lap * 0.008,
    };
  }),
};
