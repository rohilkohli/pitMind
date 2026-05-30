import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

// ── Real F1 video background (royalty-free from Mixkit CDN) ──────────────────
// Sources: Free stock racing videos, no attribution required (Mixkit License)
// https://mixkit.co/license/#stockLicense
const VIDEO_SOURCES = [
  // Racing car going at speed on track — cinematic, dark, moody
  "https://assets.mixkit.co/videos/4136/4136-1080.mp4",
  // Car racing on track at night — perfect dark background
  "https://assets.mixkit.co/videos/615/615-1080.mp4",
  // Formula car pit lane / track activity
  "https://assets.mixkit.co/videos/14898/14898-720.mp4",
  // High speed racetrack aerial
  "https://assets.mixkit.co/videos/22391/22391-720.mp4",
];

const RacingBackground = () => (
  <div
    style={{
      position: "fixed",
      inset: 0,
      overflow: "hidden",
      zIndex: 0,
      pointerEvents: "none",
    }}
  >
    {/* HTML5 video — autoplay, muted, looping */}
    <video
      autoPlay
      muted
      loop
      playsInline
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        objectPosition: "center",
        filter: "brightness(0.60) saturate(1.2) contrast(1.05)",
      }}
    >
      {VIDEO_SOURCES.map((src) => (
        <source key={src} src={src} type="video/mp4" />
      ))}
    </video>

    {/* Dark gradient overlay to keep glass card readable */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "linear-gradient(180deg, rgba(6,6,10,0.45) 0%, rgba(6,6,10,0.20) 40%, rgba(6,6,10,0.50) 100%)",
      }}
    />

    {/* Red left-edge vignette matching F1 brand */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(ellipse 60% 80% at 0% 50%, rgba(232,0,45,0.12) 0%, transparent 60%)",
      }}
    />

    {/* Bottom darkening for text legibility */}
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: "25%",
        background: "linear-gradient(0deg, rgba(6,6,10,0.65) 0%, transparent 100%)",
      }}
    />

    {/* Animated speed lines on top of video */}
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        style={{
          position: "absolute",
          top: `${20 + i * 25}%`,
          left: 0,
          right: 0,
          height: 1,
          background: `linear-gradient(90deg, transparent 0%, rgba(232,0,45,${0.15 - i * 0.04}) 40%, rgba(232,0,45,${0.08 - i * 0.02}) 70%, transparent 100%)`,
          animation: `speed-line ${4 + i}s ease-in-out infinite`,
          animationDelay: `${i * 1.2}s`,
        }}
      />
    ))}
  </div>
);

// ── PitMind Logo ──────────────────────────────────────────────────────────────
const PitMindLogo = () => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 14,
      marginBottom: 28,
    }}
  >
    {/* Logo mark */}
    <div style={{ position: "relative" }}>
      <div
        style={{
          width: 72,
          height: 72,
          background: "linear-gradient(135deg, #e8002d 0%, #b30020 100%)",
          clipPath: "polygon(0 0, 82% 0, 100% 100%, 18% 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 0 32px rgba(232,0,45,0.5), 0 0 64px rgba(232,0,45,0.2)",
        }}
      >
        <span
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: 20,
            fontWeight: 900,
            color: "#fff",
            letterSpacing: "0.05em",
          }}
        >
          PM
        </span>
      </div>
      {/* Glow pulse ring */}
      <div
        style={{
          position: "absolute",
          inset: -4,
          clipPath: "polygon(0 0, 82% 0, 100% 100%, 18% 100%)",
          background: "transparent",
          border: "1px solid rgba(232,0,45,0.4)",
          animation: "logo-pulse 3s ease-in-out infinite",
        }}
      />
    </div>
    <div
      style={{
        fontFamily: "'Orbitron', sans-serif",
        fontSize: 22,
        fontWeight: 900,
        letterSpacing: "0.25em",
        color: "var(--text-primary)",
        textTransform: "uppercase",
      }}
    >
      PIT<span style={{ color: "var(--f1-red)" }}>MIND</span>
    </div>
    <div
      style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.3em",
        color: "var(--text-secondary)",
        textTransform: "uppercase",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <span
        style={{ width: 20, height: 1, background: "var(--f1-red)", display: "inline-block" }}
      />
      AI Race Strategy Copilot
      <span
        style={{ width: 20, height: 1, background: "var(--f1-red)", display: "inline-block" }}
      />
    </div>
  </div>
);

const features = [
  { icon: "⚡", label: "Live Strategy", desc: "Engineer-grade recommendations in real time" },
  { icon: "🧠", label: "AI Trace", desc: "Structured reasoning & explainable evidence" },
  { icon: "🏎️", label: "Fan Mode", desc: "Public-facing live race narrative" },
  { icon: "📡", label: "Telemetry", desc: "FastF1-powered lap data analysis" },
];

export function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      if (!auth) {
        setError(
          "Firebase auth is not configured. Set VITE_FIREBASE_API_KEY and related Firebase env vars.",
        );
        return;
      }
      await signInWithPopup(auth, googleProvider);
      navigate("/dashboard");
    } catch (err: unknown) {
      // Parse Firebase error codes for user-friendly messages
      const code = (err as { code?: string })?.code;
      const friendlyMessages: Record<string, string> = {
        "auth/popup-blocked":
          "Sign-in popup was blocked by your browser. Please allow popups for this site and try again.",
        "auth/popup-closed-by-user":
          "Sign-in window was closed before completing. Please try again.",
        "auth/cancelled-popup-request":
          "Another sign-in attempt is in progress. Please wait and try again.",
        "auth/network-request-failed":
          "Network error. Please check your internet connection and try again.",
        "auth/too-many-requests":
          "Too many sign-in attempts. Please wait a few minutes and try again.",
        "auth/user-disabled":
          "This account has been disabled. Please contact support.",
        "auth/account-exists-with-different-credential":
          "An account already exists with a different sign-in method.",
        "auth/internal-error":
          "An internal error occurred. Please try again.",
      };
      setError(
        (code && friendlyMessages[code]) ||
          (err instanceof Error ? err.message : "Failed to sign in with Google. Please try again."),
      );
    } finally {
      setLoading(false);
    }
  };


  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        minHeight: "100vh",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
      }}
    >
      <RacingBackground />

      {/* Main glass container */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          width: "100%",
          maxWidth: 920,
          /* Glass outer frame */
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(12,12,18,0.85) 30%, rgba(6,6,10,0.75) 100%)",
          backdropFilter: "blur(40px) saturate(200%) brightness(1.06)",
          WebkitBackdropFilter: "blur(40px) saturate(200%) brightness(1.06)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderTop: "1px solid rgba(255,255,255,0.18)",
          boxShadow:
            "0 1px 0 rgba(255,255,255,0.10) inset, " +
            "0 32px 80px rgba(0,0,0,0.7), " +
            "0 8px 24px rgba(0,0,0,0.5), " +
            "0 0 120px rgba(232,0,45,0.08)",
          overflow: "hidden",
          isolation: "isolate",
        }}
      >
        {/* Glass shimmer sweep across full card */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.04) 50%, transparent 70%)",
            animation: "glass-sweep 7s ease-in-out infinite",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
        {/* Top-edge bright glass reflection */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 1,
            background: "rgba(255,255,255,0.20)",
            pointerEvents: "none",
            zIndex: 2,
          }}
        />
        {/* Red bottom accent bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 2,
            background:
              "linear-gradient(90deg, transparent 0%, var(--f1-red) 30%, rgba(232,0,45,0.6) 70%, transparent 100%)",
            boxShadow: "0 0 20px rgba(232,0,45,0.6), 0 0 40px rgba(232,0,45,0.3)",
            zIndex: 2,
          }}
        />

        {/* ── LEFT PANEL — Info ─────────────────────────────────────── */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            padding: "52px 44px",
            borderRight: "1px solid rgba(255,255,255,0.08)",
            background:
              "linear-gradient(135deg, rgba(232,0,45,0.04) 0%, rgba(255,255,255,0.01) 50%, transparent 100%)",
            overflow: "hidden",
          }}
        >
          {/* Red left edge bar */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 3,
              height: "100%",
              background: "linear-gradient(180deg, var(--f1-red) 0%, rgba(232,0,45,0.3) 100%)",
              boxShadow: "2px 0 20px rgba(232,0,45,0.4)",
            }}
          />
          {/* Diagonal accent in corner */}
          <div
            style={{
              position: "absolute",
              top: -60,
              right: -60,
              width: 200,
              height: 200,
              background: "radial-gradient(circle, rgba(232,0,45,0.06) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          {/* Badge */}
          <div
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: "var(--text-secondary)",
              marginBottom: 24,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span
              style={{ width: 16, height: 1, background: "var(--f1-red)", display: "inline-block" }}
            />
            Engineer Portal
          </div>

          <h1
            style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: 42,
              fontWeight: 900,
              letterSpacing: "-0.02em",
              lineHeight: 0.9,
              color: "var(--text-primary)",
              marginBottom: 10,
              textTransform: "uppercase",
            }}
          >
            PIT<span style={{ color: "var(--f1-red)" }}>MIND</span>
          </h1>

          <p
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "var(--f1-red)",
              marginBottom: 18,
              opacity: 0.9,
            }}
          >
            AI Race Strategy Copilot
          </p>

          <p
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              color: "var(--text-secondary)",
              lineHeight: 1.75,
              marginBottom: 36,
              maxWidth: 280,
            }}
          >
            Authenticate with Google to access the live strategy workspace, simulation tools, and AI
            explanation trace.
          </p>

          {/* Feature list — glass cards with red accent */}
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {features.map((feat, i) => (
              <div
                key={feat.label}
                className="login-feature-row"
                style={{
                  borderLeft: "3px solid var(--f1-red)",
                  padding: "10px 14px",
                  background:
                    "linear-gradient(90deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0.01) 100%)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  transition: "background 0.25s, box-shadow 0.25s",
                  cursor: "default",
                  animationDelay: `${i * 0.1}s`,
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background =
                    "linear-gradient(90deg, rgba(232,0,45,0.08) 0%, rgba(255,255,255,0.02) 100%)";
                  el.style.boxShadow = "inset 0 0 20px rgba(232,0,45,0.05)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background =
                    "linear-gradient(90deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0.01) 100%)";
                  el.style.boxShadow = "none";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 2,
                  }}
                >
                  <span style={{ fontSize: 12 }}>{feat.icon}</span>
                  <span
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {feat.label}
                  </span>
                </div>
                <p
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 9.5,
                    color: "rgba(255,255,255,0.35)",
                    lineHeight: 1.4,
                    paddingLeft: 20,
                  }}
                >
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>

          {/* IBM tools badge row */}
          <div
            style={{
              marginTop: 24,
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
            }}
          >
            {["IBM Granite", "Docling", "Langflow"].map((tool) => (
              <span
                key={tool}
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.4)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  padding: "3px 8px",
                  background: "rgba(255,255,255,0.04)",
                  backdropFilter: "blur(4px)",
                }}
              >
                {tool}
              </span>
            ))}
          </div>
        </div>

        {/* ── RIGHT PANEL — Login card ──────────────────────────────── */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            padding: "52px 44px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
          }}
        >
          <PitMindLogo />

          <h2
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: "var(--text-primary)",
              marginBottom: 4,
              textAlign: "center",
            }}
          >
            Sign In
          </h2>

          <p
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10,
              color: "var(--text-secondary)",
              textAlign: "center",
              marginBottom: 32,
              letterSpacing: "0.05em",
            }}
          >
            Use your Google account to continue
          </p>

          {/* Error state */}
          {error && (
            <div
              style={{
                width: "100%",
                padding: "12px 16px",
                background:
                  "linear-gradient(90deg, rgba(232,0,45,0.12) 0%, rgba(232,0,45,0.04) 100%)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(232,0,45,0.3)",
                borderLeft: "3px solid var(--f1-red)",
                marginBottom: 20,
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10,
                color: "var(--f1-red)",
                lineHeight: 1.6,
                boxShadow: "0 4px 20px rgba(232,0,45,0.12), inset 0 0 20px rgba(232,0,45,0.04)",
              }}
            >
              {error}
            </div>
          )}

          {/* Google Sign-In button */}
          <button
            id="login-google-btn"
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: "100%",
              marginBottom: 12,
              position: "relative",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              padding: "14px 24px",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 100%)",
              backdropFilter: "blur(20px) saturate(180%)",
              WebkitBackdropFilter: "blur(20px) saturate(180%)",
              border: "1px solid rgba(255,255,255,0.18)",
              borderTop: "1px solid rgba(255,255,255,0.25)",
              boxShadow:
                "0 1px 0 rgba(255,255,255,0.12) inset, " +
                "0 8px 32px rgba(0,0,0,0.4), " +
                "0 2px 8px rgba(0,0,0,0.3)",
              color: "#fff",
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              transition: "all 0.25s ease",
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                const el = e.currentTarget as HTMLElement;
                el.style.background =
                  "linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.08) 100%)";
                el.style.borderColor = "rgba(255,255,255,0.28)";
                el.style.boxShadow =
                  "0 1px 0 rgba(255,255,255,0.15) inset, 0 12px 40px rgba(0,0,0,0.5), 0 0 30px rgba(255,255,255,0.04)";
                el.style.transform = "translateY(-1px)";
              }
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background =
                "linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 100%)";
              el.style.borderColor = "rgba(255,255,255,0.18)";
              el.style.boxShadow =
                "0 1px 0 rgba(255,255,255,0.12) inset, 0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3)";
              el.style.transform = "translateY(0)";
            }}
          >
            {/* Shimmer on button hover */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.06) 50%, transparent 70%)",
                animation: "glass-sweep 4s ease-in-out infinite",
                pointerEvents: "none",
              }}
            />
            {loading ? (
              <>
                <span
                  style={{
                    display: "inline-block",
                    width: 12,
                    height: 12,
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "#fff",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
                <span style={{ position: "relative" }}>Authenticating...</span>
              </>
            ) : (
              <>
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  style={{ position: "relative", flexShrink: 0 }}
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="white"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="white"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="white"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="white"
                  />
                </svg>
                <span style={{ position: "relative" }}>Sign in with Google</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 12,
            }}
          >
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 9,
                color: "rgba(255,255,255,0.25)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              or
            </span>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
          </div>

          {/* Fan Mode link — glass chip */}
          <a
            href="/fan"
            id="login-fan-mode-link"
            style={{
              width: "100%",
              display: "block",
              padding: "11px 16px",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.08)",
              textAlign: "center",
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "var(--text-secondary)",
              textDecoration: "none",
              transition: "all 0.25s ease",
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background =
                "linear-gradient(180deg, rgba(232,0,45,0.08) 0%, rgba(232,0,45,0.03) 100%)";
              el.style.borderColor = "rgba(232,0,45,0.25)";
              el.style.color = "var(--f1-red)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background =
                "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)";
              el.style.borderColor = "rgba(255,255,255,0.08)";
              el.style.color = "var(--text-secondary)";
            }}
          >
            Continue as Fan →
          </a>

          {/* Version / build info */}
          <div
            style={{
              marginTop: 28,
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 9,
              color: "rgba(255,255,255,0.18)",
              textAlign: "center",
              letterSpacing: "0.08em",
            }}
          >
            PitMind v1.0 · IBM Granite · Docling · Langflow
          </div>
        </div>
      </div>

      {/* Keyframes injected locally */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes speed-line {
          0%   { opacity: 0; transform: scaleX(0); transform-origin: left; }
          20%  { opacity: 1; }
          80%  { opacity: 1; }
          100% { opacity: 0; transform: scaleX(1.4); transform-origin: right; }
        }
        @keyframes logo-pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50%       { opacity: 0.7; transform: scale(1.06); }
        }
      `}</style>
    </div>
  );
}
