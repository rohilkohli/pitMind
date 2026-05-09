import type { RaceState } from "../../hooks/useFirebaseRaceState";

export function KpiStrip({ raceState }: { raceState: RaceState | null }) {
  const leader = raceState?.standings?.find(s => s.position === 1);
  const fastest = raceState?.fastest_lap;

  return (
    <div className="flex w-full snap-x snap-mandatory gap-4 overflow-x-auto pb-2 md:h-20">
      {/* Leader Card */}
      <div 
        className="flex min-w-[160px] snap-center flex-col justify-center rounded-lg bg-black/40 p-3"
        style={{ borderLeft: `4px solid ${leader ? leader.team_color : 'transparent'}` }}
      >
        <span className="text-xs uppercase tracking-wide text-pit-muted">Leader</span>
        <span className="font-mono text-[22px] text-pit-fg">{leader ? leader.driver : "—"}</span>
      </div>

      {/* Fastest Lap Card */}
      <div className="flex min-w-[160px] snap-center flex-col justify-center rounded-lg bg-black/40 p-3">
        <span className="text-xs uppercase tracking-wide text-pit-muted">Fastest Lap</span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[22px] text-pit-fg">{fastest ? fastest.lap_time_s.toFixed(3) : "—"}</span>
          {fastest && (
            <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[11px] uppercase tracking-wider text-purple-400">
              {fastest.driver}
            </span>
          )}
        </div>
      </div>

      {/* Safety Car Card */}
      <div className="flex min-w-[160px] snap-center flex-col justify-center rounded-lg bg-black/40 p-3">
        <span className="text-xs uppercase tracking-wide text-pit-muted">Safety Car</span>
        <div>
          {raceState?.safety_car_active ? (
            <span className="inline-flex items-center rounded-full bg-red-500/20 px-2 py-0.5 text-[11px] uppercase tracking-wider text-red-400">
              <span className="mr-1 h-2 w-2 rounded-full bg-red-500"></span>
              ACTIVE
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-green-500/20 px-2 py-0.5 text-[11px] uppercase tracking-wider text-green-400">
              <span className="mr-1 h-2 w-2 rounded-full bg-green-500"></span>
              CLEAR
            </span>
          )}
        </div>
      </div>

      {/* DRS Card */}
      <div className="flex min-w-[160px] snap-center flex-col justify-center rounded-lg bg-black/40 p-3">
        <span className="text-xs uppercase tracking-wide text-pit-muted">DRS</span>
        <div>
          {raceState?.drs_open ? (
            <span className="inline-flex rounded-full bg-pit-accent/20 px-2 py-0.5 text-[11px] uppercase tracking-wider text-pit-accent">
              OPEN
            </span>
          ) : (
            <span className="inline-flex rounded-full bg-black/60 px-2 py-0.5 text-[11px] uppercase tracking-wider text-pit-muted border border-pit-stroke">
              CLOSED
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
