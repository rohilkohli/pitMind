import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

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
    <div className="flex min-h-screen items-center justify-center bg-carbon text-pit-fg">
      <div className="w-full max-w-md rounded-lg border border-pit-stroke bg-black/60 p-8 shadow-lg backdrop-blur">
        <h1 className="mb-2 text-center text-2xl font-semibold">PitMind Engineer Login</h1>
        <p className="mb-6 text-center text-sm text-pit-muted">
          Authenticate with Google to access the full strategy dashboard.
        </p>
        
        {error && (
          <div className="mb-4 rounded border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          className="w-full rounded-md bg-pit-accent px-4 py-2 font-semibold text-white transition-colors hover:bg-pit-accent/80 focus-ring"
        >
          Sign in with Google
        </button>

        <div className="mt-6 text-center text-sm text-pit-muted">
          Are you a fan? <a href="/fan" className="text-pit-accent hover:underline">Go to Fan Mode</a>
        </div>
      </div>
    </div>
  );
}
