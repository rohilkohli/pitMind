import { useFirebaseRaceState } from "../hooks/useFirebaseRaceState";
import { LiveTrackMap } from "../components/fan/LiveTrackMap";
import { WhatIfSimulator } from "../components/fan/WhatIfSimulator";
import { demoDriverA } from "../data/demoTelemetry";
import type { RaceState } from "../hooks/useFirebaseRaceState";

// Simple fallback RaceState built from demo telemetry for local/dev when Firebase has no live data
function buildDemoRaceState(): RaceState {
  const lastLap = demoDriverA.laps[demoDriverA.laps.length - 1];
  return {
    session_status: "LIVE",
    current_lap: lastLap.lap,
    total_laps: demoDriverA.laps.length,
    safety_car_active: false,
    drs_open: true,
    fastest_lap: { driver: demoDriverA.driver, lap_time_s: lastLap.lap_time_s ?? 0 },
    standings: [
      {
        driver: demoDriverA.driver,
        position: 1,
        gap_ahead_s: null,
        gap_leader_s: 0,
        lap: lastLap.lap,
        lap_time_s: lastLap.lap_time_s ?? null,
        tyre_compound: lastLap.tyre_compound || "MEDIUM",
        tyre_age_laps: 1,
        team_color: "#f87171",
      },
    ],
  };
}

export function FanMode() {
  const { raceState, loading } = useFirebaseRaceState("current_race");

  const fallback = buildDemoRaceState();

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-pit-fg mb-2">Fan Experience</h1>
        <p className="text-sm text-pit-muted">Follow the race in real-time and predict team strategies.</p>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-pit-stroke bg-black/40">
          <p className="text-sm text-pit-muted animate-pulse">Connecting to live race telemetry...</p>
        </div>
      ) : (
        <div className="space-y-6">
          <LiveTrackMap raceState={raceState ?? fallback} />
          <WhatIfSimulator raceState={raceState ?? fallback} />
        </div>
      )}
    </div>
  );
}
