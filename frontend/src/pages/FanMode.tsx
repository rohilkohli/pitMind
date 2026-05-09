import { useFirebaseRaceState } from "../hooks/useFirebaseRaceState";
import { LiveTrackMap } from "../components/fan/LiveTrackMap";
import { WhatIfSimulator } from "../components/fan/WhatIfSimulator";

export function FanMode() {
  const { raceState, loading } = useFirebaseRaceState("current_race");

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
          <LiveTrackMap raceState={raceState} />
          <WhatIfSimulator raceState={raceState} />
        </div>
      )}
    </div>
  );
}
