import type { RaceState } from "../../hooks/useFirebaseRaceState";

export function KpiStrip({ raceState }: { raceState: RaceState | null }) {
  const leader = raceState?.standings?.find((s) => s.position === 1);
  const fastest = raceState?.fastest_lap;

  const kpis = [
    {
      label: "Pit Urgency Score",
      value: "84",
      unit: "/ 100 — PIT NOW OPTIMAL",
      colorClass: "red",
    },
    {
      label: "AI Confidence",
      value: fastest ? `${(fastest.lap_time_s * 1.1).toFixed(0)}%` : "91%",
      unit: "GRANITE MODEL CERTAINTY",
      colorClass: "green",
    },
    {
      label: "Leader",
      value: leader ? leader.driver : "VER",
      unit: `P${leader?.position ?? 1} · ${raceState?.session_status ?? "RACE LIVE"}`,
      colorClass: "",
    },
    {
      label: "Strategy Calls",
      value: "12",
      unit: "SESSION TOTAL · 4 APPROVED",
      colorClass: "amber",
    },
  ];

  return (
    <div className="pm-kpi-strip">
      {kpis.map((kpi) => (
        <div key={kpi.label} className="pm-kpi-item">
          <div className="pm-kpi-label">{kpi.label}</div>
          <div className={`pm-kpi-value ${kpi.colorClass}`}>{kpi.value}</div>
          <div className="pm-kpi-unit">{kpi.unit}</div>
        </div>
      ))}
    </div>
  );
}
