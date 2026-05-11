import type { RaceState } from "../../hooks/useFirebaseRaceState";

export function KpiStrip({ raceState }: { raceState: RaceState | null }) {
  const leader = raceState?.standings?.find(s => s.position === 1);
  const fastest = raceState?.fastest_lap;

  return (
    <div className="grid gap-3 md:grid-cols-4">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_12px_32px_rgba(0,0,0,0.25)] backdrop-blur">
        <span className="text-[10px] uppercase tracking-[0.3em] text-pit-muted">Leader</span>
        <div className="mt-2 flex items-end justify-between gap-3">
          <span className="font-mono text-2xl text-pit-fg">{leader ? leader.driver : "—"}</span>
          {leader && <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-pit-muted">#{leader.position}</span>}
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/30">
          <div className="h-full w-[76%] rounded-full bg-gradient-to-r from-pit-accent to-orange-400" style={{ backgroundColor: leader?.team_color }} />
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_12px_32px_rgba(0,0,0,0.25)] backdrop-blur">
        <span className="text-[10px] uppercase tracking-[0.3em] text-pit-muted">Fastest Lap</span>
        <div className="mt-2 flex items-end justify-between gap-3">
          <span className="font-mono text-2xl text-pit-fg">{fastest ? fastest.lap_time_s.toFixed(3) : "—"}</span>
          {fastest && <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-pit-muted">{fastest.driver}</span>}
        </div>
        <p className="mt-3 text-xs text-pit-muted">Best pace currently shaping the strategy window.</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_12px_32px_rgba(0,0,0,0.25)] backdrop-blur">
        <span className="text-[10px] uppercase tracking-[0.3em] text-pit-muted">Safety Car</span>
        <div className="mt-2">
          {raceState?.safety_car_active ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-red-300">
              <span className="h-2 w-2 rounded-full bg-red-400" />
              Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Clear
            </span>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_12px_32px_rgba(0,0,0,0.25)] backdrop-blur">
        <span className="text-[10px] uppercase tracking-[0.3em] text-pit-muted">DRS</span>
        <div className="mt-2">
          {raceState?.drs_open ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-pit-accent/25 bg-pit-accent/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-pit-accent">
              Open
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-pit-muted">
              Closed
            </span>
          )}
        </div>
        <p className="mt-3 text-xs text-pit-muted">Track-state indicator for overtaking conditions.</p>
      </div>
    </div>
  );
}
