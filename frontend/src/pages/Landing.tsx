import { useState, useEffect, Suspense, lazy } from "react";
import { useNavigate } from "react-router-dom";
import { useFirebaseRaceState } from "../hooks/useFirebaseRaceState";
import { auth } from "../lib/firebase";
import { NavBar } from "../components/layout/NavBar";
import { PartnerMarquee } from "../components/layout/PartnerMarquee";
// Lazy load heavy components
const LapChart = lazy(() =>
  import("../components/dashboard/LapChart").then((m) => ({ default: m.LapChart })),
);
const EventTimeline = lazy(() =>
  import("../components/dashboard/EventTimeline").then((m) => ({ default: m.EventTimeline })),
);
const DecisionLog = lazy(() =>
  import("../components/dashboard/DecisionLog").then((m) => ({ default: m.DecisionLog })),
);

type Mode = "RACE_LIVE" | "ENGINEER" | "PRE_RACE" | "FAN";

export function Landing() {
  const navigate = useNavigate();
  const { raceState } = useFirebaseRaceState("current_race");

  const [mode, setMode] = useState<Mode>("FAN");
  const [showOverride, setShowOverride] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);

  const f1HeroImages = [
    "/img/f1/bg1.png",
    "/img/f1/bg2.png",
    "/img/f1/bg3.png",
    "/img/f1/bg4.png",
    "/img/f1/bg5.png",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % f1HeroImages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [f1HeroImages.length]);

  // MOCK_LAP_DATA equivalent from Strategy.tsx
  const mockChartData = Array.from({ length: 57 }, (_, i) => ({
    lap: i + 1,
    VER: 81.4 + Math.sin(i / 5) * 0.3 + (Math.random() - 0.5) * 0.2,
    LEC: 81.7 + Math.sin(i / 6) * 0.25 + (Math.random() - 0.5) * 0.2,
    NOR: 81.9 + Math.sin(i / 4) * 0.35 + (Math.random() - 0.5) * 0.2,
    HAM: 82.2 + Math.sin(i / 7) * 0.3 + (Math.random() - 0.5) * 0.2,
  }));

  // Auto-detect mode on mount
  useEffect(() => {
    const hour = new Date().getHours();
    const isLoggedIn = !!auth?.currentUser;
    const isRaceLive = raceState?.session_status === "LIVE";
    const isRaceHour = hour >= 13 && hour <= 19;

    let detectedMode: Mode = "FAN";
    if (isRaceLive) {
      detectedMode = "RACE_LIVE";
    } else if (isLoggedIn && !isRaceLive) {
      detectedMode = "ENGINEER";
    } else if (isRaceHour && !isRaceLive && !isLoggedIn) {
      detectedMode = "PRE_RACE";
    }

    setMode(detectedMode);
    localStorage.setItem("pitmind_visited", "true");
  }, [raceState?.session_status]);

  const switchMode = (newMode: Mode) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setMode(newMode);
      setShowOverride(false);
      setIsTransitioning(false);
    }, 200);
  };

  // ─────────────────────────────────────────────────────────────────
  // MODE: RACE_LIVE
  // ─────────────────────────────────────────────────────────────────
  const renderRaceLive = () => (
    <div style={{ display: "flex", height: "calc(100vh - 100px)", width: "100%" }}>
      {/* LEFT 60% */}
      <div
        style={{
          width: "60%",
          padding: "60px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 11,
            color: "var(--text-secondary)",
            letterSpacing: "0.2em",
          }}
        >
          PIT URGENCY
        </div>
        <div
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: 120,
            fontWeight: 900,
            color: "var(--f1-red)",
            lineHeight: 1,
            textShadow: "0 0 20px rgba(232,0,45,0.4)",
          }}
        >
          84
        </div>

        <div
          style={{
            marginTop: 30,
            padding: 20,
            border: "1px solid var(--f1-red)",
            background: "rgba(232,0,45,0.05)",
            borderLeft: "4px solid var(--f1-red)",
          }}
        >
          <div
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 10,
              color: "var(--f1-red)",
              letterSpacing: "0.15em",
              marginBottom: 10,
            }}
          >
            ◆ GRANITE RECOMMENDATION
          </div>
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 13,
              color: "var(--text-primary)",
              lineHeight: 1.6,
            }}
          >
            Tyre wear at 73%. Lap time degradation trend exceeds threshold. Pit window optimal at
            current lap.
          </div>
          <ul
            style={{
              marginTop: 15,
              paddingLeft: 20,
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 12,
              color: "var(--text-secondary)",
              lineHeight: 1.8,
            }}
          >
            <li>Tyre wear: 73%</li>
            <li>Lap delta: +0.31s</li>
            <li>Gap to P2: 1.8s</li>
          </ul>
        </div>

        <div style={{ display: "flex", gap: 20, marginTop: 40 }}>
          <button className="pm-btn-primary" onClick={() => navigate("/strategy")}>
            OPEN STRATEGY CONSOLE
          </button>
          <button className="pm-btn-secondary" onClick={() => switchMode("FAN")}>
            FAN VIEW
          </button>
        </div>
      </div>

      {/* RIGHT 40% */}
      <div
        style={{
          width: "40%",
          background: "var(--carbon-light)",
          borderLeft: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ flex: 1, padding: "40px" }}>
          {[
            {
              label: "GAP TO P2",
              value: raceState?.standings?.[1]?.gap_leader_s
                ? `${raceState.standings[1].gap_leader_s}s`
                : "1.821s",
            },
            { label: "CURRENT LAP", value: "34 / 57" },
            { label: "TYRE WEAR", value: "73%", color: "var(--amber)" },
            { label: "PIT WINDOW", value: "LAP 36–38", color: "var(--f1-red)" },
          ].map((row, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                borderBottom: "1px solid var(--f1-red-dim)",
                paddingBottom: 15,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 14,
                  color: "var(--text-secondary)",
                  letterSpacing: "0.15em",
                }}
              >
                {row.label}
              </div>
              <div
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: 24,
                  fontWeight: 700,
                  color: row.color || "var(--text-primary)",
                }}
              >
                {row.value}
              </div>
            </div>
          ))}
        </div>
        <div
          style={{ height: 180, borderTop: "1px solid var(--border)", background: "var(--carbon)" }}
        >
          <Suspense fallback={<div className="skeleton-row" style={{ height: "100%" }} />}>
            <LapChart data={mockChartData} minimal={true} />
          </Suspense>
        </div>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────
  // MODE: ENGINEER
  // ─────────────────────────────────────────────────────────────────
  const renderEngineer = () => (
    <div
      style={{
        display: "flex",
        height: "calc(100vh - 100px)",
        width: "100%",
        padding: 40,
        gap: 40,
      }}
    >
      {/* LEFT 320px */}
      <div style={{ width: 320 }}>
        <div
          className="pm-panel"
          style={{ height: "100%", display: "flex", flexDirection: "column" }}
        >
          <div className="pm-panel-header">
            <div className="pm-panel-title">LAST SESSION</div>
          </div>
          <div style={{ padding: 20, flex: 1 }}>
            <div
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: 42,
                fontWeight: 900,
                color: "var(--text-primary)",
                letterSpacing: "-0.02em",
              }}
            >
              MONZA
            </div>
            <div
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11,
                color: "var(--text-secondary)",
                marginTop: 5,
              }}
            >
              PRACTICE 2 · SEP 1, 2023
            </div>

            <div style={{ marginTop: 40 }}>
              {[
                { label: "Total Calls", value: "12" },
                { label: "Approved", value: "4" },
                { label: "Avg Confidence", value: "76%" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 15,
                    borderBottom: "1px solid var(--border)",
                    paddingBottom: 5,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: 12,
                      color: "var(--text-secondary)",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                    }}
                  >
                    {stat.label}
                  </span>
                  <span
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 13,
                      color: "var(--text-primary)",
                    }}
                  >
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <button
            className="pm-btn-primary"
            style={{ margin: 20, width: "calc(100% - 40px)" }}
            onClick={() => navigate("/strategy")}
          >
            RESUME SESSION →
          </button>
        </div>
      </div>

      {/* RIGHT 1fr */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 40 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {[
            {
              title: "STRATEGY CONSOLE",
              desc: "Live race orchestration",
              path: "/strategy",
              badge: "",
            },
            {
              title: "TELEMETRY ANALYSIS",
              desc: "Deep dive into lap data",
              path: "/telemetry",
              badge: "",
            },
            {
              title: "POST-RACE DEBRIEF",
              desc: "Generate PDF reports",
              path: "/strategy",
              badge: "DOCLING ENABLED",
              badgeColor: "var(--amber)",
            },
            {
              title: "FAN MODE PREVIEW",
              desc: "See public facing UI",
              path: "/fan",
              badge: "IBM GRANITE",
              badgeColor: "var(--f1-red)",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="pm-panel"
              style={{ padding: 24, cursor: "pointer", transition: "all 0.2s" }}
              onClick={() => navigate(card.path)}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 16, fontWeight: 700 }}
                >
                  {card.title}
                </div>
                {card.badge && (
                  <span
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: 10,
                      padding: "2px 6px",
                      background: "rgba(255,255,255,0.1)",
                      color: card.badgeColor,
                      border: `1px solid ${card.badgeColor}`,
                      borderRadius: 2,
                    }}
                  >
                    {card.badge}
                  </span>
                )}
              </div>
              <div
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 11,
                  color: "var(--text-secondary)",
                  marginTop: 10,
                }}
              >
                {card.desc}
              </div>
            </div>
          ))}
        </div>

        <div className="pm-panel" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div className="pm-panel-header">
            <div className="pm-panel-title">RECENT DECISIONS</div>
          </div>
          <div style={{ flex: 1, overflowY: "auto", paddingRight: 8 }}>
            <Suspense fallback={<div className="skeleton-row" style={{ height: 120 }} />}>
              <DecisionLog onExportSession={() => {}} showHeader={false} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────
  // MODE: PRE_RACE
  // ─────────────────────────────────────────────────────────────────
  const renderPreRace = () => (
    <div style={{ width: "100%", padding: "60px 40px", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 60 }}>
        <div
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 14,
            color: "var(--f1-red)",
            letterSpacing: "0.3em",
            marginBottom: 20,
          }}
        >
          NEXT RACE STARTS IN
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
          {["02", "14", "33"].map((num, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center" }}>
              <div
                style={{
                  padding: "20px 30px",
                  border: "1px solid var(--f1-red)",
                  background: "rgba(232,0,45,0.05)",
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: 72,
                  fontWeight: 900,
                  color: "var(--text-primary)",
                  lineHeight: 1,
                }}
              >
                {num}
              </div>
              {i < 2 && (
                <div
                  style={{
                    fontSize: 48,
                    fontWeight: 700,
                    margin: "0 10px",
                    color: "var(--text-secondary)",
                  }}
                >
                  :
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 30 }}>
        {/* LEFT */}
        <div className="pm-panel">
          <div className="pm-panel-header">
            <div className="pm-panel-title">GRANITE PRE-RACE FORECAST</div>
            <span className="pm-panel-badge pm-badge-live">IBM</span>
          </div>
          <div style={{ padding: 20 }}>
            <div
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: 20,
                fontWeight: 700,
                color: "var(--f1-red)",
                marginBottom: 15,
              }}
            >
              SOFT → HARD ONE-STOP
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <div
                style={{
                  width: "100%",
                  height: 4,
                  background: "var(--border)",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    height: "100%",
                    width: "78%",
                    background: "var(--f1-red)",
                  }}
                />
              </div>
              <div
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 12,
                  color: "var(--text-secondary)",
                }}
              >
                78%
              </div>
            </div>
            <ul
              style={{
                paddingLeft: 20,
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 12,
                color: "var(--text-secondary)",
                lineHeight: 1.8,
              }}
            >
              <li>High track temp favors harder compounds</li>
              <li>Low safety car probability expected</li>
              <li>Overtaking delta requires &gt;1.2s pace advantage</li>
            </ul>
          </div>
        </div>

        {/* CENTER */}
        <div className="pm-panel" style={{ display: "flex", flexDirection: "column" }}>
          <div className="pm-panel-header">
            <div className="pm-panel-title">TRACK CONDITIONS</div>
          </div>
          <div
            style={{
              padding: 20,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px 10px",
              flex: 1,
              alignContent: "center",
            }}
          >
            {[
              { label: "CIRCUIT", value: "MONZA" },
              { label: "TEMP", value: "28°C" },
              { label: "WEATHER", value: "DRY" },
              { label: "DRS", value: "ENABLED", color: "var(--neon-green)" },
              { label: "WIND", value: "12 km/h NW" },
            ].map((cond) => (
              <div key={cond.label}>
                <div
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: 10,
                    color: "var(--text-secondary)",
                    letterSpacing: "0.15em",
                    marginBottom: 4,
                  }}
                >
                  {cond.label}
                </div>
                <div
                  style={{
                    fontFamily: "'Orbitron', sans-serif",
                    fontSize: 14,
                    fontWeight: 700,
                    color: cond.color || "var(--text-primary)",
                  }}
                >
                  {cond.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT */}
        <div className="pm-panel">
          <div className="pm-panel-header">
            <div className="pm-panel-title">TYRE ALLOCATION</div>
          </div>
          <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 15 }}>
            {[
              { name: "SOFT", color: "var(--f1-red)", sets: 4, deg: "High", pace: "-1.2s" },
              { name: "MEDIUM", color: "#FFD12E", sets: 2, deg: "Med", pace: "Baseline" },
              { name: "HARD", color: "#FFFFFF", sets: 1, deg: "Low", pace: "+0.8s" },
            ].map((tyre) => (
              <div key={tyre.name} style={{ display: "flex", alignItems: "center", gap: 15 }}>
                <div
                  style={{ width: 12, height: 12, borderRadius: "50%", background: tyre.color }}
                />
                <div style={{ flex: 1 }}>
                  <div
                    style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 14, fontWeight: 700 }}
                  >
                    {tyre.name}
                  </div>
                  <div
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 10,
                      color: "var(--text-secondary)",
                    }}
                  >
                    Deg: {tyre.deg} | Pace: {tyre.pace}
                  </div>
                </div>
                <div
                  style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 16, fontWeight: 700 }}
                >
                  x{tyre.sets}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 60,
          textAlign: "center",
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 11,
          color: "var(--text-secondary)",
          letterSpacing: "0.1em",
        }}
      >
        WHEN RACE STARTS, PITMIND ACTIVATES AUTOMATICALLY
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────
  // MODE: FAN
  // ─────────────────────────────────────────────────────────────────
  const renderFan = () => (
    <div style={{ width: "100%" }}>
      {/* Hero */}
      <div
        style={{
          height: "60vh",
          display: "flex",
          alignItems: "center",
          padding: "0 80px",
          position: "relative",
          borderBottom: "1px solid var(--border)",
          overflow: "hidden",
        }}
      >
        {/* Animated Background Layers */}
        {f1HeroImages.map((img, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `linear-gradient(to right, rgba(10, 10, 10, 0.95) 0%, rgba(10, 10, 10, 0.5) 50%, rgba(10, 10, 10, 0.8) 100%), url('${img}')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: bgIndex === i ? 1 : 0,
              transition: "opacity 2s ease-in-out",
              zIndex: 0,
            }}
          />
        ))}

        <div className="animate-blur-in" style={{ flex: 1, zIndex: 1, position: "relative" }}>
          <div
            style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: 96,
              fontWeight: 900,
              color: "var(--f1-red)",
              lineHeight: 0.9,
            }}
          >
            MONACO
          </div>
          <div
            style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: 96,
              fontWeight: 900,
              color: "transparent",
              WebkitTextStroke: "1px var(--text-primary)",
              lineHeight: 0.9,
              opacity: 0.6,
            }}
          >
            GRAND PRIX
          </div>
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 14,
              color: "var(--text-secondary)",
              marginTop: 20,
              letterSpacing: "0.2em",
            }}
          >
            AI RACE STRATEGY — EXPLAINED FOR EVERYONE
          </div>
        </div>
        <div
          className="animate-blur-in-delayed"
          style={{ zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}
        >
          <svg width="200" height="200" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="var(--border)" strokeWidth="6" />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="var(--f1-red)"
              strokeWidth="6"
              strokeDasharray="251"
              strokeDashoffset="40"
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
            />
            <text
              x="50"
              y="55"
              fontFamily="'Orbitron', sans-serif"
              fontSize="24"
              fontWeight="900"
              fill="var(--text-primary)"
              textAnchor="middle"
            >
              84
            </text>
          </svg>
          <div
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 12,
              color: "var(--text-secondary)",
              letterSpacing: "0.2em",
              marginTop: -10,
            }}
          >
            CURRENT PIT URGENCY
          </div>
        </div>
      </div>

      {/* 3 Features */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 30,
          padding: "60px 80px",
        }}
      >
        {[
          {
            title: "LIVE STRATEGY",
            desc: "See every pit call explained in plain English",
            btn: "TRY FAN MODE →",
            path: "/fan",
            bgImg:
              "https://upload.wikimedia.org/wikipedia/commons/7/70/1985_European_GP_Stefan_Johansson_01.jpg",
          },
          {
            title: "WHAT-IF SIMULATOR",
            desc: "Test your own strategy decisions with AI",
            btn: "SIMULATE NOW →",
            path: "/fan",
            bgImg:
              "https://upload.wikimedia.org/wikipedia/commons/1/14/2010_Malaysian_GP_opening_lap.jpg",
          },
          {
            title: "AI REASONING",
            desc: "IBM Granite explains every recommendation",
            btn: "HOW IT WORKS →",
            path: "/fan",
            bgImg:
              "https://upload.wikimedia.org/wikipedia/commons/1/1c/Alfa-Romeo-159-%281951%29.jpg",
          },
        ].map((feat, i) => (
          <div
            key={i}
            className="pm-panel pm-interactive-card"
            style={{ padding: 30, position: "relative", overflow: "hidden" }}
            onClick={() => navigate(feat.path)}
          >
            <div className="pm-card-bg" style={{ backgroundImage: `url('${feat.bgImg}')` }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: 20,
                  fontWeight: 700,
                  marginBottom: 10,
                }}
              >
                {feat.title}
              </div>
              <div
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  marginBottom: 30,
                  minHeight: 40,
                }}
              >
                {feat.desc}
              </div>
              <button
                className="pm-btn-secondary"
                style={{ width: "100%", fontSize: 11 }}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(feat.path);
                }}
              >
                {feat.btn}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Mini Timeline */}
      <div style={{ padding: "0 80px 60px 80px" }}>
        <div
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: 16,
            fontWeight: 700,
            marginBottom: 20,
          }}
        >
          LAST RACE HIGHLIGHTS
        </div>
        <div className="pm-panel" style={{ padding: 20, maxHeight: 300, overflowY: "auto" }}>
          <Suspense fallback={<div className="skeleton-row" style={{ height: 100 }} />}>
            <EventTimeline />
          </Suspense>
        </div>
      </div>

      {/* CTA Strip */}
      <div
        style={{
          background: "var(--f1-red)",
          padding: "30px 80px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: 18,
            fontWeight: 700,
            color: "#fff",
          }}
        >
          ENGINEER? SIGN IN FOR FULL STRATEGY ACCESS
        </div>
        <button
          onClick={() => navigate("/login")}
          style={{
            background: "#fff",
            color: "var(--f1-red)",
            border: "none",
            padding: "12px 24px",
            fontFamily: "'Orbitron', sans-serif",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            clipPath: "polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)",
          }}
        >
          SIGN IN WITH GOOGLE →
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--carbon)", color: "var(--text-primary)" }}>
      <NavBar />

      {/* MODE INDICATOR */}
      <div
        style={{
          height: 36,
          background: "var(--carbon-light)",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 20px",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {mode === "RACE_LIVE" && (
            <div
              className="pm-panel-badge pm-badge-live"
              style={{ animation: "flicker 2s infinite" }}
            >
              ◉ RACE MODE — LIVE SESSION ACTIVE
            </div>
          )}
          {mode === "ENGINEER" && (
            <div className="pm-panel-badge pm-badge-ok">◆ ENGINEER MODE — STRATEGY CONSOLE</div>
          )}
          {mode === "PRE_RACE" && (
            <div
              className="pm-panel-badge"
              style={{ color: "var(--amber)", borderColor: "var(--amber)" }}
            >
              ◈ PRE-RACE MODE — RACE IN 1H 24M
            </div>
          )}
          {mode === "FAN" && (
            <div
              className="pm-panel-badge"
              style={{ color: "var(--text-secondary)", borderColor: "var(--text-secondary)" }}
            >
              ○ FAN MODE — EXPLORE STRATEGY
            </div>
          )}
        </div>
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            color: "var(--text-secondary)",
            cursor: "pointer",
            letterSpacing: "0.1em",
          }}
          onClick={() => setShowOverride(!showOverride)}
        >
          AUTO-DETECTED · SWITCH MODE →
        </div>

        {/* OVERRIDE DROPDOWN */}
        {showOverride && (
          <div
            style={{
              position: "absolute",
              top: 35,
              right: 20,
              background: "var(--carbon)",
              border: "1px solid var(--border)",
              zIndex: 100,
              display: "flex",
              flexDirection: "column",
              minWidth: 200,
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            }}
          >
            {(["RACE_LIVE", "ENGINEER", "PRE_RACE", "FAN"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                style={{
                  background: "transparent",
                  border: "none",
                  borderBottom: "1px solid var(--border)",
                  padding: "12px 16px",
                  textAlign: "left",
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 14,
                  color: m === mode ? "var(--f1-red)" : "var(--text-primary)",
                  cursor: "pointer",
                }}
              >
                {m.replace("_", " ")}
              </button>
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          opacity: isTransitioning ? 0 : 1,
          transition: "opacity 0.2s ease-in-out",
          minHeight: "calc(100vh - 100px)",
        }}
      >
        {mode === "RACE_LIVE" && renderRaceLive()}
        {mode === "ENGINEER" && renderEngineer()}
        {mode === "PRE_RACE" && renderPreRace()}
        {mode === "FAN" && renderFan()}
      </div>

      <PartnerMarquee />
    </div>
  );
}
