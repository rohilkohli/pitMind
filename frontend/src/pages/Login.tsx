import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Card, CardContent } from "../components/ui/card";

// F1 Shield Logo
const F1ShieldLogo = () => (
  <svg viewBox="0 0 80 80" fill="none" width="80" height="80" className="mx-auto">
    <rect width="80" height="80" fill="#E10600" />
    <path d="M20 16h20v8H28v4h10v8H28v12H20V16z" fill="white" />
    <path d="M44 16h16l-16 24h16" stroke="white" strokeWidth="4" fill="none" />
  </svg>
);

export function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      if (!auth) {
        setError("Firebase auth is not configured. Set VITE_FIREBASE_API_KEY/VITE_FIREBASE_WEB_API_KEY and related Firebase env vars.");
        return;
      }
      await signInWithPopup(auth, googleProvider);
      navigate("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to sign in with Google.");
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10 bg-f1-black text-f1-white">
      <div className="relative grid w-full max-w-4xl gap-8">
        {/* Left: Information Panel */}
        <div className="f1-card border-0 p-8">
          <p className="text-xs font-bold uppercase tracking-widest text-f1-muted">Engineer Portal</p>
          <h1 className="mt-4 text-4xl font-display font-black uppercase md:text-5xl">PitMind</h1>
          <p className="mt-2 text-sm font-display font-bold uppercase text-f1-red">AI Race Strategy Copilot</p>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-f1-secondary">
            Authenticate with Google to access the live strategy workspace, simulation tools, and explanation trace.
          </p>

          <div className="mt-8 space-y-3">
            <div className="border-l-4 border-f1-red bg-f1-dark p-4">
              <div className="text-xs font-bold uppercase tracking-widest text-f1-muted">Live Strategy</div>
              <p className="mt-2 text-sm text-f1-secondary">Engineer-grade recommendations</p>
            </div>
            <div className="border-l-4 border-f1-red bg-f1-dark p-4">
              <div className="text-xs font-bold uppercase tracking-widest text-f1-muted">AI Trace</div>
              <p className="mt-2 text-sm text-f1-secondary">Structured reasoning and evidence</p>
            </div>
            <div className="border-l-4 border-f1-red bg-f1-dark p-4">
              <div className="text-xs font-bold uppercase tracking-widest text-f1-muted">Fan Mode</div>
              <p className="mt-2 text-sm text-f1-secondary">Public-facing race narrative</p>
            </div>
          </div>
        </div>

        {/* Right: Login Card */}
        <Card className="mx-auto w-full max-w-md border-0">
          <CardContent className="p-8">
            <F1ShieldLogo />
            <h2 className="mt-6 text-2xl font-display font-black uppercase text-center text-f1-white">Sign In</h2>
            <p className="mt-2 text-sm text-center text-f1-secondary">Use your Google account to continue</p>

            {error && (
              <div className="mt-6 border border-f1-red bg-f1-dark p-4 text-sm text-f1-red">
                {error}
              </div>
            )}

            <button
              onClick={handleLogin}
              className="mt-6 f1-btn w-full py-3 flex items-center justify-center gap-3"
            >
              <span className="text-lg">G</span>
              SIGN IN WITH GOOGLE
            </button>

            <div className="mt-6 border border-f1-border bg-f1-dark p-4 text-sm text-f1-secondary">
              New to PitMind? <a href="/fan" className="text-f1-red hover:underline font-bold">FAN MODE</a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
