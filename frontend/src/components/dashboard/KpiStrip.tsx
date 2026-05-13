import type { RaceState } from "../../hooks/useFirebaseRaceState";

export function KpiStrip({ raceState }: { raceState: RaceState | null }) {
  const leader = raceState?.standings?.find(s => s.position === 1);
  const fastest = raceState?.fastest_lap;

  return (
    <div className="grid gap-4 md:grid-cols-4 animate-fade-in">
      <div className="f1-card p-4 border-l-4" style={{ borderColor: leader?.team_color || '#38383F' }}>
        <p className="text-f1-muted text-xs font-bold uppercase tracking-widest">Leader</p>
        <p className="font-display text-3xl font-black text-f1-white mt-2">{leader ? leader.driver : "—"}</p>
        <p className="text-f1-muted text-xs mt-1">P{leader?.position || "—"}</p>
      </div>

      <div className="f1-card p-4">
        <p className="text-f1-muted text-xs font-bold uppercase tracking-widest">Fastest Lap</p>
        <p className="f1-mono text-3xl font-black text-f1-white mt-2">{fastest ? fastest.lap_time_s.toFixed(3) : "—"}</p>
        <p className="text-f1-muted text-xs mt-1">{fastest?.driver || "—"}</p>
      </div>

      <div className="f1-card p-4">
        <p className="text-f1-muted text-xs font-bold uppercase tracking-widest">Safety Car</p>
        <div className="mt-4">
          {raceState?.safety_car_active ? (
            <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-bold uppercase tracking-widest text-f1-red f1-badge">
              <span className="h-2.5 w-2.5 rounded-full bg-f1-red animate-pulse-red" />
              Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-bold uppercase tracking-widest text-f1-white bg-f1-border">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              Clear
            </span>
          )}
        </div>
      </div>

      <div className="f1-card p-4">
        <p className="text-f1-muted text-xs font-bold uppercase tracking-widest">DRS</p>
        <div className="mt-4">
          {raceState?.drs_open ? (
            <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-bold uppercase tracking-widest text-f1-red f1-badge">
              <span className="h-2.5 w-2.5 bg-f1-red animate-pulse" />
              Open
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-bold uppercase tracking-widest text-f1-white bg-f1-border">
              <span className="h-2.5 w-2.5 bg-f1-elevated" />
              Closed
            </span>
          )}
        </div>
        <p className="mt-3 text-xs font-medium text-f1-muted">Track status for overtaking window.</p>
      </div>
    </div>
  );
}
