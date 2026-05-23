import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

// PitMind Logo Mark — red parallelogram + PM in Orbitron
const PitMindLogo = () => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      gap: 12,
      marginBottom: 24,
    }}
  >
    <div
      style={{
        width: 64,
        height: 64,
        background: "var(--f1-red)",
        clipPath: "polygon(0 0, 85% 0, 100% 100%, 15% 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span
        style={{
          fontFamily: "'Orbitron', sans-serif",
          fontSize: 18,
          fontWeight: 900,
          color: "#fff",
          letterSpacing: "0.05em",
        }}
      >
        PM
      </span>
    </div>
    <div
      style={{
        fontFamily: "'Orbitron', sans-serif",
        fontSize: 20,
        fontWeight: 900,
        letterSpacing: "0.2em",
        color: "var(--text-primary)",
        textTransform: "uppercase",
        animation: "glitch 8s infinite",
      }}
    >
      PITMIND
    </div>
  </div>
);

const features = [
  { label: "Live Strategy", desc: "Engineer-grade recommendations in real time" },
  { label: "AI Trace", desc: "Structured reasoning and explainable evidence" },
  { label: "Fan Mode", desc: "Public-facing live race narrative" },
  { label: "Telemetry", desc: "FastF1-powered lap data analysis" },
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
      setError(err instanceof Error ? err.message : "Failed to sign in with Google.");
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
        background: "var(--carbon)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 0,
          width: "100%",
          maxWidth: 900,
          border: "1px solid var(--border)",
        }}
      >
        {/* Left: Information Panel */}
        <div
          style={{
            background: "var(--carbon-mid)",
            padding: "48px",
            borderRight: "1px solid var(--border)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Left border reveal */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 3,
              height: "100%",
              background: "var(--f1-red)",
            }}
          />

          {/* Badge */}
          <div
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "var(--text-secondary)",
              marginBottom: 20,
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
              fontSize: 40,
              fontWeight: 900,
              letterSpacing: "-0.02em",
              lineHeight: 0.92,
              color: "var(--text-primary)",
              marginBottom: 8,
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
              marginBottom: 16,
            }}
          >
            AI Race Strategy Copilot
          </p>

          <p
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              color: "var(--text-secondary)",
              lineHeight: 1.7,
              marginBottom: 32,
            }}
          >
            Authenticate with Google to access the live strategy workspace, simulation tools, and
            explanation trace.
          </p>

          {/* Feature list — red left-border accent lines */}
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {features.map((feat) => (
              <div
                key={feat.label}
                style={{
                  borderLeft: "3px solid var(--f1-red)",
                  padding: "10px 14px",
                  marginBottom: 1,
                  background: "rgba(255,255,255,0.02)",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "var(--f1-red-dim)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)";
                }}
              >
                <div
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "var(--text-secondary)",
                    marginBottom: 2,
                  }}
                >
                  {feat.label}
                </div>
                <p
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 10,
                    color: "var(--text-secondary)",
                    lineHeight: 1.4,
                  }}
                >
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Login Card */}
        <div
          style={{
            background: "var(--carbon-light)",
            padding: "48px 40px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <PitMindLogo />

          <h2
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "var(--text-primary)",
              marginBottom: 6,
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
              marginBottom: 28,
            }}
          >
            Use your Google account to continue
          </p>

          {/* Error */}
          {error && (
            <div
              style={{
                width: "100%",
                padding: "10px 14px",
                border: "1px solid var(--f1-red)",
                borderLeft: "3px solid var(--f1-red)",
                background: "var(--f1-red-dim)",
                marginBottom: 20,
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10,
                color: "var(--f1-red)",
                lineHeight: 1.5,
              }}
            >
              {error}
            </div>
          )}

          {/* Sign In Button — full-width red parallelogram */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="pm-btn-primary"
            style={{ width: "100%", marginBottom: 20 }}
          >
            {loading ? (
              <>
                <span
                  style={{
                    display: "inline-block",
                    width: 10,
                    height: 10,
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "#fff",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                    marginRight: 10,
                  }}
                />
                AUTHENTICATING...
              </>
            ) : (
              <>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  style={{ marginRight: 10 }}
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
                SIGN IN WITH GOOGLE
              </>
            )}
          </button>

          {/* Fan Mode link */}
          <div
            style={{
              padding: "10px 14px",
              border: "1px solid var(--border)",
              background: "var(--carbon)",
              width: "100%",
              textAlign: "center",
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10,
              color: "var(--text-secondary)",
            }}
          >
            New to PitMind?{" "}
            <a
              href="/fan"
              style={{
                color: "var(--f1-red)",
                fontWeight: 600,
                textDecoration: "none",
                letterSpacing: "0.1em",
              }}
            >
              FAN MODE →
            </a>
          </div>

          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    </div>
  );
}
