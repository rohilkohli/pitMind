import type { DriverState } from "../../hooks/useFirebaseRaceState";

export function StandingsTable({ standings }: { standings: DriverState[] | undefined }) {
  if (!standings || standings.length === 0) {
    return <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-pit-muted">No standings data available.</div>;
  }

  // Helper to map tyre compound to a CSS variable class (defined in tailwind config or index.css)
  const getTyreColor = (compound: string) => {
    switch (compound.toUpperCase()) {
      case "SOFT": return "var(--tyre-soft)";
      case "MEDIUM": return "var(--tyre-medium)";
      case "HARD": return "var(--tyre-hard)";
      case "INTERMEDIATE": return "var(--tyre-inter)";
      case "WET": return "var(--tyre-wet)";
      default: return "var(--tyre-medium)";
    }
  };

  return (
    <div className="flex h-full flex-col rounded-3xl border border-white/10 bg-white/5 shadow-[0_12px_32px_rgba(0,0,0,0.28)] backdrop-blur">
      <div className="sticky top-0 z-10 rounded-t-3xl border-b border-white/8 bg-carbon/80 px-4 py-4 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.32em] text-pit-muted">Standings</h2>
            <p className="mt-1 text-xs text-pit-muted">Current order and tyre status</p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-pit-muted">{standings.length} cars</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto px-2 py-2">
        <table className="w-full text-left text-sm">
          <thead className="sr-only">
            <tr>
              <th>Position</th>
              <th>Driver</th>
              <th>Gap</th>
              <th>Tyre</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {standings.map((driver) => (
              <tr 
                key={driver.driver} 
                className="h-[44px] transition-colors hover:bg-white/5"
              >
                <td className="w-8 pl-3 pr-2 font-mono text-pit-muted">{driver.position}</td>
                <td className="flex h-[44px] items-center gap-2 px-2 font-semibold text-pit-fg">
                  <span 
                    className="h-2.5 w-2.5 rounded-full shadow-[0_0_12px_currentColor]" 
                    style={{ backgroundColor: driver.team_color }} 
                  />
                  {driver.driver}
                </td>
                <td className="px-2 font-mono text-pit-muted">
                  {driver.position === 1 
                    ? "Leader" 
                    : `+${driver.gap_leader_s?.toFixed(3) || "—"}`}
                </td>
                <td className="pr-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span 
                      className="rounded-full px-2.5 py-1 text-[11px] font-bold uppercase"
                      style={{ 
                        backgroundColor: getTyreColor(driver.tyre_compound),
                        color: "#fff",
                        textShadow: "0 1px 2px rgba(0,0,0,0.5)"
                      }}
                    >
                      {driver.tyre_compound[0]}
                    </span>
                    <span className="w-7 text-right font-mono text-xs text-pit-muted">
                      {driver.tyre_age_laps}L
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
