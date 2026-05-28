import { useEffect, useRef } from "react";
import { useOptionalAuthUser } from "../../hooks/useOptionalAuthUser";
import { Link, useLocation } from "react-router-dom";
import { auth } from "../../lib/firebase";

export function NavBar() {
  const { user } = useOptionalAuthUser();
  const location = useLocation();
  const isEngineer =
    location.pathname.includes("dashboard") || location.pathname.includes("copilot");
  const topbarRef = useRef<HTMLElement>(null);

  // Animate the lap progress bar
  useEffect(() => {
    // currentLap/totalLaps — using a static demo value; real value would come from raceState
    const progress = (34 / 57) * 100;
    if (topbarRef.current) {
      topbarRef.current.style.setProperty("--nav-progress", `${progress.toFixed(1)}%`);
    }
  }, []);

  const navLinks = [
    { label: "Dashboard", to: "/dashboard" },
    { label: "Fan Mode", to: "/fan" },
    { label: "Strategy", to: "/strategy" },
    { label: "Telemetry", to: "/telemetry" },
  ];

  return (
    <header ref={topbarRef} className="pm-topbar">
      {/* Logo */}
      <Link to="/" className="pm-logo">
        <div className="pm-logo-box">
          <span>PM</span>
        </div>
        <span className="pm-logo-text">PITMIND</span>
      </Link>

      {/* Nav Links */}
      <nav aria-label="Main navigation" style={{ display: "flex", gap: "2px", flex: 1 }}>
        {navLinks.map((link) => (
          <Link
            key={link.label}
            to={link.to}
            className={`pm-nav-item ${location.pathname === link.to ? "active" : ""}`}
            style={{
              fontSize: "10px",
              letterSpacing: "0.15em",
            }}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Right: LIVE pill + Lap counter + Login/User */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginLeft: "auto" }}>
        <div
          className="pm-live-pill"
          role="status"
          aria-live="polite"
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "10px",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            borderRadius: 0,
          }}
        >
          <div className="pm-live-dot" />
          LIVE SYNC ACTIVE
        </div>

        <div className="pm-lap-counter">
          LAP <span className="accent">34</span> / 57
        </div>

        {user ? (
          <>
            <Link
              to={isEngineer ? "/fan" : "/dashboard"}
              className="pm-login-btn"
              style={{
                clipPath: "polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)",
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: "10px",
                letterSpacing: "0.15em",
                borderRadius: 0,
              }}
            >
              {isEngineer ? "FAN MODE" : "ENGINEER"}
            </Link>
            <button
              onClick={() => auth.signOut()}
              className="pm-login-btn"
              style={{
                clipPath: "polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)",
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: "10px",
                letterSpacing: "0.15em",
                borderRadius: 0,
                background: "var(--carbon)",
                border: "1px solid var(--border)",
              }}
            >
              LOG OUT
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className="pm-login-btn"
            style={{
              clipPath: "polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)",
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: "10px",
              letterSpacing: "0.15em",
              borderRadius: 0,
            }}
          >
            ENGINEER LOGIN
          </Link>
        )}
      </div>
    </header>
  );
}
