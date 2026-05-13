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
      {/* Hero Section */}
      <div className="f1-card border-0 p-8 bg-gradient-to-r from-f1-dark to-f1-black">
        <div className="f1-stripe" />
        <p className="text-xs font-bold uppercase tracking-widest text-f1-muted">Fan Experience</p>
        <h1 className="mt-4 text-4xl font-display font-black uppercase text-f1-white md:text-5xl">Monaco Grand Prix</h1>
        <h2 className="mt-2 text-2xl font-display font-bold uppercase text-f1-red">Live Race Narrative</h2>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-f1-secondary">Follow the pack, inspect the circuit, and test what-if strategy scenarios in real time.</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <span className="f1-badge f1-badge-soft text-xs">LIVE</span>
          <span className="f1-badge bg-f1-dark border border-f1-border text-f1-white text-xs">INTERACTIVE</span>
          <span className="f1-badge bg-f1-dark border border-f1-border text-f1-white text-xs">TELEMETRY</span>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center f1-card">
          <p className="text-sm text-f1-muted animate-pulse">Connecting to live race telemetry...</p>
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
