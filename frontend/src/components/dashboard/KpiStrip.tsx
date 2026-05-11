import type { RaceState } from "../../hooks/useFirebaseRaceState";

export function KpiStrip({ raceState }: { raceState: RaceState | null }) {
  const leader = raceState?.standings?.find(s => s.position === 1);
  const fastest = raceState?.fastest_lap;

  return (
    <div className="grid gap-4 md:grid-cols-4 animate-fade-in">
      <div className="rounded-2xl border border-pit-stroke bg-pit-panel/80 p-5 shadow-glow-lg backdrop-blur transition-all duration-300 hover:border-f1-red/40 hover:shadow-glow-xl">
        <span className="text-xs font-bold uppercase tracking-widest text-pit-muted">Leader</span>
        <div className="mt-3 flex items-end justify-between gap-3">
          <span className="font-mono text-3xl font-black text-f1-red">{leader ? leader.driver : "—"}</span>
          {leader && <span className="rounded-full border border-f1-red/30 bg-f1-red/10 px-3 py-1 text-xs font-bold text-f1-red uppercase">P{leader.position}</span>}
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/40">
          <div className="h-full rounded-full bg-gradient-to-r from-f1-red to-orange-500 transition-all duration-500" style={{ width: "76%", backgroundColor: leader?.team_color }} />
        </div>
      </div>

      <div className="rounded-2xl border border-pit-stroke bg-pit-panel/80 p-5 shadow-glow-lg backdrop-blur transition-all duration-300 hover:border-f1-red/40 hover:shadow-glow-xl">
        <span className="text-xs font-bold uppercase tracking-widest text-pit-muted">Fastest Lap</span>
        <div className="mt-3 flex items-end justify-between gap-3">
          <span className="font-mono text-3xl font-black text-f1-red">{fastest ? fastest.lap_time_s.toFixed(3) : "—"}</span>
          {fastest && <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-wider text-pit-muted">{fastest.driver}</span>}
        </div>
        <p className="mt-3 text-xs font-medium text-pit-muted">Best pace shaping the strategy window.</p>
      </div>

      <div className="rounded-2xl border border-pit-stroke bg-pit-panel/80 p-5 shadow-glow-lg backdrop-blur transition-all duration-300 hover:border-f1-red/40 hover:shadow-glow-xl">
        <span className="text-xs font-bold uppercase tracking-widest text-pit-muted">Safety Car</span>
        <div className="mt-4">
          {raceState?.safety_car_active ? (
            <span className="inline-flex items-center gap-2 rounded-lg border border-f1-red/40 bg-f1-red/15 px-4 py-2 text-xs font-black uppercase tracking-widest text-f1-red">
              <span className="h-2.5 w-2.5 rounded-full bg-f1-red animate-pulse-red" />
              Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-4 py-2 text-xs font-black uppercase tracking-widest text-emerald-400">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              Clear
            </span>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-pit-stroke bg-pit-panel/80 p-5 shadow-glow-lg backdrop-blur transition-all duration-300 hover:border-f1-red/40 hover:shadow-glow-xl">
        <span className="text-xs font-bold uppercase tracking-widest text-pit-muted">DRS</span>
        <div className="mt-4">
          {raceState?.drs_open ? (
            <span className="inline-flex items-center gap-2 rounded-lg border border-f1-red/40 bg-f1-red/15 px-4 py-2 text-xs font-black uppercase tracking-widest text-f1-red">
              <span className="h-2.5 w-2.5 rounded-full bg-f1-red" />
              Open
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-widest text-pit-muted">
              <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
              Closed
            </span>
          )}
        </div>
        <p className="mt-3 text-xs font-medium text-pit-muted">Track state for overtaking conditions.</p>
      </div>
    </div>
  );
}
