import type { RaceState } from "../../hooks/useFirebaseRaceState";

// Typed driver entry for the SVG map
interface TrackDriver {
  driver: string;
  team_color?: string | null;
  gap_leader_s?: number | null;
}

const MONACO_PATH = `
          M 120 380
          L 120 300
          C 120 260 140 240 180 240
          L 260 240
          C 300 240 320 220 320 180
          L 320 140
          C 320 110 340 95 370 95
          L 430 95
          C 460 95 480 110 480 140
          L 480 160
          C 480 185 495 200 520 200
          L 600 200
          C 640 200 660 220 660 260
          L 660 300
          C 660 330 640 350 610 350
          L 580 350
          C 550 350 535 365 535 390
          L 535 420
          C 535 445 515 460 490 460
          L 250 460
          C 210 460 190 440 180 420
          L 150 400
          C 140 392 130 388 120 388
          Z
`;

// Monaco Grand Prix SVG — accurate circuit outline with hairpins
function MonacoCircuitSVG({ drivers }: { drivers: TrackDriver[] }) {

  return (
    <svg
      viewBox="0 0 800 500"
      style={{ width: "100%", height: "100%", opacity: 0.85 }}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <path id="monaco-track-path" d={MONACO_PATH} />
      </defs>
      {/* Monaco circuit outline — distinctive hairpins and chicane */}
      <path
        d={MONACO_PATH}
        fill="none"
        stroke="#E8002D"
        strokeWidth="18"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Inner road color */}
      <path
        d={MONACO_PATH}
        fill="none"
        stroke="#1a1a1e"
        strokeWidth="12"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Hairpin label — Loews */}
      <text
        x="310"
        y="130"
        fill="#888890"
        fontSize="9"
        fontFamily="'Barlow Condensed', sans-serif"
        letterSpacing="0.1em"
        textAnchor="middle"
      >
        LOEWS
      </text>
      {/* Start/finish line */}
      <line x1="120" y1="370" x2="120" y2="380" stroke="#39FF14" strokeWidth="4" />
      <text
        x="90"
        y="375"
        fill="#39FF14"
        fontSize="8"
        fontFamily="'Barlow Condensed', sans-serif"
        letterSpacing="0.1em"
      >
        S/F
      </text>

      {/* Live Driver Blips */}
      {drivers.map((driver, i) => {
        // Average lap time ~80s. Delay animation based on their gap to the leader.
        // For realistic simulation, we take their actual gap in seconds.
        // If it's missing, we provide a default stagger.
        const gap = driver.gap_leader_s ?? i * 2.5;
        return (
          <g key={driver.driver}>
            <circle r="6" fill={driver.team_color || "#888"} stroke="#fff" strokeWidth="2" />
            <rect x="-12" y="-18" width="24" height="10" rx="2" fill="rgba(0,0,0,0.8)" />
            <text
              x="0"
              y="-10"
              fill="#fff"
              fontSize="8"
              fontFamily="'Orbitron', sans-serif"
              fontWeight="700"
              textAnchor="middle"
            >
              {driver.driver.slice(0, 3).toUpperCase()}
            </text>
            <animateMotion dur="80s" repeatCount="indefinite" begin={`-${gap}s`}>
              <mpath href="#monaco-track-path" />
            </animateMotion>
          </g>
        );
      })}
    </svg>
  );
}

export function LiveTrackMap({ raceState }: { raceState: RaceState | null }) {
  const topDrivers = raceState?.standings?.slice(0, 5) || [];

  return (
    <div
      style={{
        background: "var(--carbon-light)",
        border: "1px solid var(--border)",
        padding: "16px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <div className="pm-panel-title">Live Track Map</div>
        <span className="pm-panel-badge pm-badge-live">MONACO</span>
      </div>

      {/* Circuit container */}
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "16 / 9",
          background:
            "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(232,0,45,0.04) 0%, transparent 70%), var(--carbon)",
          border: "1px solid var(--border)",
          overflow: "hidden",
        }}
      >
        <MonacoCircuitSVG drivers={topDrivers} />

        {topDrivers.length === 0 && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              color: "var(--text-secondary)",
            }}
          >
            Waiting for live tracking data...
          </div>
        )}
      </div>

      {/* Legend */}
      <div
        style={{
          marginTop: 10,
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        {topDrivers.slice(0, 5).map((driver) => (
          <div
            key={driver.driver}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontFamily: "'Orbitron', sans-serif",
              fontSize: 9,
              color: "var(--text-secondary)",
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: driver.team_color || "#888",
              }}
            />
            {driver.driver.slice(0, 3).toUpperCase()}
          </div>
        ))}
      </div>
    </div>
  );
}
