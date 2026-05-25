import type { DriverState } from "../../hooks/useFirebaseRaceState";

export function StandingsTable({ standings }: { standings: DriverState[] | undefined }) {
  if (!standings || standings.length === 0) {
    return (
      <div style={{ padding: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--amber)",
              animation: "pulse-dot 2s infinite ease-in-out",
            }}
          />
          <span
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 10,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "var(--amber)",
              fontWeight: 700,
            }}
          >
            Waiting for Data
          </span>
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton-row" />
        ))}
      </div>
    );
  }

  const getTyreClass = (compound: string): string => {
    const c = compound.toUpperCase();
    if (c === "SOFT") return "pm-tyre-s";
    if (c === "MEDIUM") return "pm-tyre-m";
    if (c === "HARD") return "pm-tyre-h";
    if (c === "INTERMEDIATE") return "pm-tyre-i";
    if (c === "WET") return "pm-tyre-w";
    return "pm-tyre-m";
  };

  const getTyreAbbr = (compound: string): string => {
    const c = compound.toUpperCase();
    if (c === "SOFT") return "S";
    if (c === "MEDIUM") return "M";
    if (c === "HARD") return "H";
    if (c === "INTERMEDIATE") return "I";
    if (c === "WET") return "W";
    return compound[0] ?? "M";
  };

  return (
    <div style={{ background: "transparent" }}>
      {/* Rows */}
      <div>
        {standings.map((driver) => (
          <div key={driver.driver} className="pm-standing-row">
            {/* Position */}
            <span className={`pm-pos ${driver.position === 1 ? "p1" : ""}`}>{driver.position}</span>

            {/* Team color bar */}
            <div
              style={{
                width: 4,
                height: 28,
                background: driver.team_color || "var(--steel)",
                borderRadius: 0,
                flexShrink: 0,
              }}
            />

            {/* Driver info */}
            <div>
              <div className="pm-driver-abbr">
                {driver.driver.length > 3
                  ? driver.driver.slice(0, 3).toUpperCase()
                  : driver.driver.toUpperCase()}
              </div>
              <div
                className="pm-driver-team"
                style={{ textTransform: "uppercase", letterSpacing: "0.15em" }}
              >
                {driver.driver}
              </div>
            </div>

            {/* Gap */}
            <div className="pm-driver-gap">
              {driver.position === 1 ? "LEADER" : `+${driver.gap_leader_s?.toFixed(3) ?? "—"}`}
            </div>

            {/* Tyre badge */}
            <div className={`pm-tyre-badge ${getTyreClass(driver.tyre_compound)}`}>
              {getTyreAbbr(driver.tyre_compound)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
