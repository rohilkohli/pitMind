import type { DriverState } from "../../hooks/useFirebaseRaceState";

export function StandingsTable({ standings }: { standings: DriverState[] | undefined }) {
  if (!standings || standings.length === 0) {
    return <div className="p-4 text-sm text-pit-muted">No standings data available.</div>;
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
    <div className="flex flex-col">
      <div className="sticky top-0 bg-carbon pb-2 pt-4">
        <h2 className="px-4 text-[11px] font-semibold uppercase tracking-widest text-pit-muted">Standings</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-left text-sm">
          <thead className="sr-only">
            <tr>
              <th>Position</th>
              <th>Driver</th>
              <th>Gap</th>
              <th>Tyre</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-pit-stroke/50">
            {standings.map((driver) => (
              <tr 
                key={driver.driver} 
                className="h-[40px] transition-colors hover:bg-black/40"
              >
                <td className="w-8 pl-4 pr-2 font-mono text-pit-muted">{driver.position}</td>
                <td className="px-2 font-semibold text-pit-fg flex items-center h-[40px] gap-2">
                  <span 
                    className="h-2 w-2 rounded-full" 
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
                      className="rounded-full px-2 py-0.5 text-[11px] font-bold uppercase"
                      style={{ 
                        backgroundColor: getTyreColor(driver.tyre_compound),
                        color: "#fff",
                        textShadow: "0 1px 2px rgba(0,0,0,0.5)"
                      }}
                    >
                      {driver.tyre_compound[0]}
                    </span>
                    <span className="w-6 font-mono text-xs text-pit-muted text-right">
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
