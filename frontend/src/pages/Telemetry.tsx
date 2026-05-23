import { Suspense, lazy } from "react";
import { useFirebaseRaceState } from "../hooks/useFirebaseRaceState";
import { useDashboardState } from "../hooks/useDashboardState";
import { useTelemetry } from "../hooks/useTelemetry";
import { demoDriverA } from "../data/demoTelemetry";

import { KpiStrip } from "../components/dashboard/KpiStrip";
import { ShareButton } from "../components/dashboard/ShareButton";
import { StreamHealthMonitor } from "../components/dashboard/StreamHealthMonitor";
import { RoleSwitcher } from "../components/dashboard/RoleSwitcher";
import { useRole } from "../contexts/RoleContext";
import { EventTimeline } from "../components/dashboard/EventTimeline";

const LapChart = lazy(() =>
  import("../components/dashboard/LapChart").then((m) => ({ default: m.LapChart })),
);
const FastF1Loader = lazy(() =>
  import("../components/dashboard/FastF1Loader").then((m) => ({ default: m.FastF1Loader })),
);
const LiveSystemFeed = lazy(() =>
  import("../components/dashboard/LiveSystemFeed").then((m) => ({ default: m.LiveSystemFeed })),
);

export function Telemetry() {
  const { raceState } = useFirebaseRaceState("current_race");
  const { currentRole, setRole } = useRole();
  const { getShareableUrl, copyShareableUrl } = useDashboardState({ timeFilter: "live" });
  const { payload: localPayload } = useTelemetry(demoDriverA);

  const mockLapData = Array.from({ length: 57 }, (_, i) => ({
    lap: i + 1,
    VER: 81.4 + Math.sin(i / 5) * 0.3 + (Math.random() - 0.5) * 0.2,
    LEC: 81.7 + Math.sin(i / 6) * 0.25 + (Math.random() - 0.5) * 0.2,
    NOR: 81.9 + Math.sin(i / 4) * 0.35 + (Math.random() - 0.5) * 0.2,
    HAM: 82.2 + Math.sin(i / 7) * 0.3 + (Math.random() - 0.5) * 0.2,
  }));

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        width: "100%",
        background: "var(--carbon)",
        color: "var(--text-primary)",
        overflowX: "hidden",
        paddingBottom: 80,
      }}
    >
      {/* Sub-header bar */}
      <div
        style={{
          borderBottom: "1px solid var(--border)",
          background: "rgba(10,10,10,0.9)",
          padding: "10px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 52,
          zIndex: 100,
          backdropFilter: "blur(12px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div>
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "var(--f1-red)",
                marginBottom: 2,
              }}
            >
              PitMind Mission Control
            </div>
            <div
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: 14,
                fontWeight: 700,
                textTransform: "uppercase",
                color: "var(--text-primary)",
                letterSpacing: "0.05em",
              }}
            >
              Telemetry & Data{" "}
              <span style={{ color: "var(--text-secondary)", fontSize: 10, fontWeight: 400 }}>
                v1.2.5
              </span>
            </div>
          </div>
          <div style={{ width: 1, height: 36, background: "var(--border)" }} />
          <div className="pm-live-pill">
            <div className="pm-live-dot" />
            LIVE SYNC ACTIVE
          </div>
          <RoleSwitcher currentRole={currentRole} onRoleChange={setRole} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              display: "flex",
              gap: 20,
              paddingRight: 20,
              borderRight: "1px solid var(--border)",
            }}
          >
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "var(--text-secondary)",
                }}
              >
                Circuit
              </div>
              <div
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "var(--text-primary)",
                }}
              >
                {localPayload.circuit}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "var(--text-secondary)",
                }}
              >
                Status
              </div>
              <div
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "var(--f1-red)",
                }}
              >
                {raceState?.session_status ?? "RACE LIVE"}
              </div>
            </div>
          </div>
          <StreamHealthMonitor showMetrics={false} />
          <ShareButton onCopyUrl={copyShareableUrl} getShareUrl={getShareableUrl} />
        </div>
      </div>

      {/* Grid Layout: 2 columns — 1fr | 320px */}
      <div
        style={{
          maxWidth: 1920,
          margin: "0 auto",
          padding: "68px 0 40px",
          height: "calc(100vh - 104px)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 320px",
            gap: 1,
            background: "var(--border)",
            height: "100%",
          }}
        >
          {/* Left Column (1fr) */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 1,
              background: "var(--border)",
              height: "100%",
              overflowY: "auto",
              minWidth: 0,
            }}
          >
            <div className="pm-panel" style={{ flex: "0 0 auto", minHeight: 100 }}>
              <KpiStrip raceState={raceState} />
            </div>
            <div className="pm-panel" style={{ flex: "1 1 auto", minHeight: 400 }}>
              <div className="pm-panel-header">
                <div className="pm-panel-title">Full Telemetry View</div>
              </div>
              <Suspense fallback={<div className="skeleton-row" style={{ height: 400 }} />}>
                <LapChart data={mockLapData} />
              </Suspense>
            </div>
          </div>

          {/* Right Column (320px) */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 1,
              background: "var(--border)",
              height: "100%",
              overflowY: "auto",
            }}
          >
            <div className="pm-panel" style={{ flex: "0 0 auto", minHeight: 180 }}>
              <Suspense fallback={<div className="skeleton-row" style={{ height: 180 }} />}>
                <FastF1Loader onDataLoaded={() => {}} />
              </Suspense>
            </div>

            <div className="pm-panel" style={{ flex: "1 1 auto", minHeight: 280 }}>
              <div className="pm-panel-header">
                <div className="pm-panel-title">Live Race Timeline</div>
              </div>
              <div style={{ overflowY: "auto", maxHeight: 250 }}>
                <EventTimeline />
              </div>
            </div>

            <div
              className="pm-panel"
              style={{ flex: "1 1 auto", minHeight: 250, overflow: "hidden" }}
            >
              <Suspense fallback={<div className="skeleton-row" style={{ height: 250 }} />}>
                <LiveSystemFeed />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
