import type { DriverState } from "../../hooks/useFirebaseRaceState";

export function StandingsTable({ standings }: { standings: DriverState[] | undefined }) {
  if (!standings || standings.length === 0) {
    return <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-f1-muted">No standings data available.</div>;
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
    <div className="flex h-full flex-col bg-f1-black border border-f1-border">
      <div className="sticky top-0 z-10 border-b border-f1-border bg-f1-dark px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-f1-muted">Live Standings</h2>
          <span className="text-xs font-bold uppercase text-f1-muted">{standings.length} CARS</span>
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
          <tbody className="divide-y divide-f1-border">
            {standings.map((driver) => (
              <tr 
                key={driver.driver} 
                className="h-12 transition-colors hover:bg-f1-elevated border-l-4"
                style={{ borderLeftColor: driver.team_color }}
              >
                <td className="w-10 pl-3 pr-2 font-display font-black text-f1-white text-lg">{driver.position}</td>
                <td className="flex h-12 items-center gap-2 px-2 font-bold text-f1-white">
                  <span 
                    className="h-3 w-3" 
                    style={{ backgroundColor: driver.team_color }} 
                  />
                  {driver.driver}
                </td>
                <td className="px-2 f1-mono text-f1-muted text-xs">
                  {driver.position === 1 
                    ? "Leader" 
                    : `+${driver.gap_leader_s?.toFixed(3) || "—"}`}
                </td>
                <td className="pr-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span 
                      className="f1-badge px-2 py-1 text-xs font-bold uppercase"
                      style={{ 
                        backgroundColor: getTyreColor(driver.tyre_compound),
                        color: "#fff",
                        textShadow: "0 1px 2px rgba(0,0,0,0.5)"
                      }}
                    >
                      {driver.tyre_compound[0]}
                    </span>
                    <span className="w-7 text-right f1-mono text-xs text-f1-muted">
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
