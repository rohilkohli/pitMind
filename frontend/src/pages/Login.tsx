import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Card, CardContent } from "../components/ui/card";

export function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      navigate("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to sign in with Google.");
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10 text-pit-fg">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(225,6,0,0.18),_transparent_26%),radial-gradient(circle_at_bottom_right,_rgba(20,184,166,0.14),_transparent_28%)]" />
      <div className="relative grid w-full max-w-5xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur">
          <p className="text-[10px] font-semibold uppercase tracking-[0.36em] text-pit-muted">Secure access</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">PitMind Engineer Login</h1>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-pit-muted">
            Authenticate with Google to access the live strategy workspace, simulation tools, and explanation trace.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-[10px] uppercase tracking-[0.28em] text-pit-muted">Live strategy</div>
              <p className="mt-2 text-sm text-pit-fg">Engineer-grade call generation</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-[10px] uppercase tracking-[0.28em] text-pit-muted">AI trace</div>
              <p className="mt-2 text-sm text-pit-fg">Structured rationale and evidence</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-[10px] uppercase tracking-[0.28em] text-pit-muted">Fan mode</div>
              <p className="mt-2 text-sm text-pit-fg">Public-facing race narrative</p>
            </div>
          </div>
        </div>

        <Card className="border-white/10 bg-white/5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur">
          <CardContent className="p-8">
            <p className="text-[10px] uppercase tracking-[0.36em] text-pit-muted">Engineer portal</p>
            <h2 className="mt-3 text-2xl font-semibold text-pit-fg">Sign in to continue</h2>
            <p className="mt-2 text-sm text-pit-muted">Use your Google account to unlock the dashboard.</p>

            {error && (
              <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              onClick={handleLogin}
              className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl bg-pit-accent px-4 py-3 font-semibold text-white shadow-[0_18px_40px_rgba(225,6,0,0.25)] transition-transform hover:-translate-y-0.5 hover:bg-pit-accent/85 focus-ring"
            >
              <span className="text-lg">G</span>
              Sign in with Google
            </button>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-pit-muted">
              Are you a fan? <a href="/fan" className="text-pit-accent hover:underline">Go to Fan Mode</a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
