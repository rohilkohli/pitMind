import { Suspense, lazy, useRef, useCallback, useEffect, useState } from "react";
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

const SIDEBAR_MIN = 240;
const SIDEBAR_MAX = 560;
const SIDEBAR_DEFAULT = 340;
const SIDEBAR_LS_KEY = "pm-telemetry-sidebar-w";

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

  // ── Sidebar resize ───────────────────────────────────────────────────────
  const [sidebarW, setSidebarW] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_LS_KEY);
      if (stored) {
        const n = parseInt(stored, 10);
        if (n >= SIDEBAR_MIN && n <= SIDEBAR_MAX) return n;
      }
    } catch {
      // Ignore invalid persisted sidebar width.
    }
    return SIDEBAR_DEFAULT;
  });

  const dragging = useRef(false);
  const startX = useRef(0);
  const startW = useRef(0);
  const missionRef = useRef<HTMLDivElement>(null);
  const [missionH, setMissionH] = useState(0);

  const onSeparatorMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragging.current = true;
      startX.current = e.clientX;
      startW.current = sidebarW;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [sidebarW],
  );

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      // Dragging left = sidebar grows (separator is on the left of sidebar)
      const delta = startX.current - e.clientX;
      const next = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, startW.current + delta));
      setSidebarW(next);
    };
    const onMouseUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      setSidebarW((prev) => {
        try {
          localStorage.setItem(SIDEBAR_LS_KEY, String(prev));
        } catch {
          // Ignore storage write failures.
        }
        return prev;
      });
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);
  // Keep the console body locked to the viewport below the top bars.
  useEffect(() => {
    if (!missionRef.current) return;

    const updateMissionHeight = () => {
      setMissionH(missionRef.current?.offsetHeight ?? 0);
    };

    updateMissionHeight();
    const obs = new ResizeObserver(updateMissionHeight);
    obs.observe(missionRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        background: "var(--carbon)",
        color: "var(--text-primary)",
        overflowX: "hidden",
        overflowY: "hidden",
        minHeight: "calc(100vh - var(--topbar-height, 52px))",
        height: "calc(100vh - var(--topbar-height, 52px))",
        paddingBottom: 0,
      }}
    >
      {/* ── Sub-header / Mission Control bar ─────────────────────────── */}
      <div
        ref={missionRef}
        className="pm-mission-bar"
        style={{
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div>
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 10,
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
              Telemetry &amp; Data{" "}
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
                  fontSize: 10,
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
                  fontSize: 10,
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

      {/* ── Main layout: [left 1fr] [separator 5px] [sidebar Npx] ────── */}
      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          maxWidth: 1920,
          margin: "0 auto",
          paddingTop: 8,
          height: missionH
            ? `calc(100vh - var(--topbar-height, 52px) - ${missionH}px)`
            : "calc(100vh - var(--topbar-height, 52px) - 56px)",
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        {/* Left column — content-sized, no forced height */}
        <div
          style={{
            flex: "1 1 0",
            minWidth: 0,
            minHeight: 0,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 1,
            background: "var(--border)",
            overflow: "hidden",
          }}
        >
          {/* KPI strip */}
          <div className="pm-panel" style={{ flexShrink: 0 }}>
            <KpiStrip raceState={raceState} />
          </div>

          {/* Lap chart — grows to exactly fill gap left by sidebar */}
          <div
            className="pm-panel"
            style={{
              flex: "1 1 0",
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            <Suspense fallback={<div className="skeleton-row" style={{ height: "100%" }} />}>
              <LapChart data={mockLapData} fillHeight />
            </Suspense>
          </div>
        </div>

        {/* ── Drag separator ─────────────────────────────────────────── */}
        <div
          onMouseDown={onSeparatorMouseDown}
          title="Drag to resize sidebar"
          style={{
            width: 5,
            alignSelf: "stretch",
            cursor: "col-resize",
            background: "var(--border)",
            flexShrink: 0,
            position: "relative",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--f1-red)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "var(--border)")}
        />

        {/* Right sidebar — sticky, width controlled by drag */}
        <div
          style={{
            width: sidebarW,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            gap: 1,
            background: "var(--border)",
            height: "100%",
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          {/* FastF1 Loader */}
          <div className="pm-panel" style={{ flex: "0 0 auto", padding: "20px 24px 18px" }}>
            <Suspense fallback={<div className="skeleton-row" style={{ height: 240 }} />}>
              <FastF1Loader onDataLoaded={() => {}} />
            </Suspense>
          </div>

          {/* Live Race Timeline — EventTimeline owns its own header & scroll */}
          <div
            className="pm-panel"
            style={{ flex: "1 1 0", minHeight: 0, overflow: "hidden", padding: 0 }}
          >
            <EventTimeline fillHeight />
          </div>
        </div>
      </div>
    </div>
  );
}
