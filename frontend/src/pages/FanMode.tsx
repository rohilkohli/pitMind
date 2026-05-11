import { useFirebaseRaceState, type RaceState } from "../hooks/useFirebaseRaceState";
import { LiveTrackMap } from "../components/fan/LiveTrackMap";
import { WhatIfSimulator } from "../components/fan/WhatIfSimulator";
import { demoDriverA } from "../data/demoTelemetry";

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
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 lg:px-6">
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(135deg,rgba(225,6,0,0.16),rgba(255,255,255,0.04),rgba(20,184,166,0.12))] p-6 shadow-[0_18px_48px_rgba(0,0,0,0.25)] backdrop-blur">
        <p className="text-[10px] font-semibold uppercase tracking-[0.36em] text-pit-muted">Fan experience</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-pit-fg md:text-4xl">Live race narrative</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-pit-muted">Follow the pack, inspect the map, and test what-if calls without needing engineer credentials.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-pit-fg">Demo fallback ready</span>
          <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-pit-fg">Strategy simulator</span>
          <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-pit-fg">Live telemetry hooks</span>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-3xl border border-white/10 bg-white/5 shadow-[0_12px_32px_rgba(0,0,0,0.28)] backdrop-blur">
          <p className="text-sm text-pit-muted animate-pulse">Connecting to live race telemetry...</p>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
          <LiveTrackMap raceState={raceState ?? fallback} />
          <WhatIfSimulator raceState={raceState ?? fallback} />
        </div>
      )}
    </div>
  );
}
