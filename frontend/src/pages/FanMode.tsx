import { useState } from "react";
import { useFirebaseRaceState, type RaceState } from "../hooks/useFirebaseRaceState";
import { LiveTrackMap } from "../components/fan/LiveTrackMap";
import { WhatIfSimulator } from "../components/fan/WhatIfSimulator";
import { demoDriverA } from "../data/demoTelemetry";

// Simple fallback RaceState built from demo telemetry for local/dev when Firebase has no live data
function buildDemoRaceState(): RaceState {
  const lastLap = demoDriverA.laps[demoDriverA.laps.length - 1];
  return {
    session_status: "LIVE",
    current_lap: lastLap.lap,
    total_laps: demoDriverA.laps.length,
    safety_car_active: false,
    drs_open: true,
    fastest_lap: { driver: demoDriverA.driver, lap_time_s: lastLap.lap_time_s ?? 0 },
    standings: [
      {
        driver: demoDriverA.driver,
        position: 1,
        gap_ahead_s: null,
        gap_leader_s: 0,
        lap: lastLap.lap,
        lap_time_s: lastLap.lap_time_s ?? null,
        tyre_compound: lastLap.tyre_compound || "MEDIUM",
        tyre_age_laps: 1,
        team_color: "#E8002D",
      },
    ],
  };
}

const TABS = ["LIVE", "INTERACTIVE", "TELEMETRY"] as const;
type Tab = (typeof TABS)[number];

export function FanMode() {
  const { raceState, loading } = useFirebaseRaceState("current_race");
  const [activeTab, setActiveTab] = useState<Tab>("LIVE");
  const fallback = buildDemoRaceState();

  return (
    <div
      style={{
        background: "var(--carbon)",
        minHeight: "100vh",
        position: "relative",
        zIndex: 10,
      }}
    >
      {/* Hero Section */}
      <div
        style={{
          padding: "80px 40px 40px",
          borderBottom: "1px solid var(--border)",
          background:
            "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(232,0,45,0.04) 0%, transparent 70%)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "relative", zIndex: 2, flex: 1 }}>
          {/* Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "var(--text-secondary)",
              marginBottom: 20,
            }}
          >
            <span
              style={{ width: 20, height: 1, background: "var(--f1-red)", display: "inline-block" }}
            />
            MONACO · RACE LIVE · 2024 MONACO GP
          </div>

          {/* Title */}
          <h1
            style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: "clamp(32px, 6vw, 72px)",
              fontWeight: 900,
              lineHeight: 0.92,
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
              marginBottom: 8,
            }}
          >
            MONACO
            <br />
            <span style={{ color: "var(--f1-red)" }}>GRAND</span>
            <br />
            PRIX
          </h1>

          {/* Subtitle */}
          <h2
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 18,
              fontWeight: 600,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: "var(--f1-red)",
              marginTop: 12,
              marginBottom: 16,
            }}
          >
            LIVE RACE NARRATIVE
          </h2>

          <p
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 14,
              fontWeight: 300,
              letterSpacing: "0.06em",
              color: "var(--text-secondary)",
              lineHeight: 1.6,
              maxWidth: 460,
              marginBottom: 28,
            }}
          >
            Follow the pack, inspect the circuit, and test what-if strategy scenarios in real time.
            Powered by IBM Granite AI.
          </p>

          {/* Throttle bar */}
          <div style={{ maxWidth: 300, marginBottom: 24 }}>
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 9,
                letterSpacing: "0.2em",
                color: "var(--text-secondary)",
                marginBottom: 6,
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              Engine Throttle
            </div>
            <div className="pm-throttle-bar">
              <div className="pm-throttle-fill" />
            </div>
          </div>

          {/* Tab strip */}
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={activeTab === tab ? "pm-login-btn" : "pm-chip"}
                style={activeTab === tab ? {} : undefined}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Right Image Container */}
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: "55%",
            zIndex: 1,
            pointerEvents: "none",
            maskImage: "linear-gradient(to right, transparent 0%, black 40%)",
            WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 40%)",
          }}
        >
          <img
            src="/f1_car_hero.png"
            alt="F1 Car"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center",
              opacity: 0.8,
            }}
          />
        </div>
      </div>

      {/* Content area */}
      <div style={{ padding: "24px 40px" }}>
        {loading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: 300,
              background: "var(--carbon-light)",
              border: "1px solid var(--border)",
            }}
          >
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11,
                color: "var(--text-secondary)",
                animation: "flicker 2s infinite",
              }}
            >
              CONNECTING TO LIVE RACE TELEMETRY...
            </span>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: 16,
            }}
          >
            {/* Large grid on wide screens */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0,1.4fr) minmax(0,1fr)",
                gap: 16,
              }}
            >
              <LiveTrackMap raceState={raceState ?? fallback} />
              <WhatIfSimulator raceState={raceState ?? fallback} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
