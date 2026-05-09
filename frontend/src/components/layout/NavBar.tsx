import { auth } from "../../lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { Link, useLocation } from "react-router-dom";

export function NavBar() {
  const [user] = useAuthState(auth);
  const location = useLocation();
  const isEngineer = location.pathname.includes("dashboard");

  return (
    <header className="flex h-12 items-center justify-between border-b border-pit-stroke bg-carbon px-4">
      <div className="flex items-center gap-4">
        <Link to="/" className="text-base font-medium text-pit-fg">PitMind</Link>
        <select className="hidden rounded-md border border-pit-stroke bg-black/40 px-2 py-1 text-sm text-pit-fg md:block">
          <option>Monza - Italian GP</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <span className="font-mono text-sm text-pit-fg">LAP 34 / 57</span>
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--live-pulse)] opacity-75"></span>
          <span className="relative inline-flex h-3 w-3 rounded-full bg-[var(--live-pulse)]"></span>
        </span>
        <span className="ml-2 rounded-full bg-teal-500/20 px-2 py-0.5 text-xs font-semibold text-teal-400">LIVE</span>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-3">
            <img src={user.photoURL || ""} alt="Avatar" className="h-8 w-8 rounded-full border border-pit-stroke" />
            <Link 
              to={isEngineer ? "/fan" : "/dashboard"} 
              className="text-xs font-medium text-pit-muted hover:text-pit-fg"
            >
              Switch to {isEngineer ? "Fan View" : "Engineer"}
            </Link>
          </div>
        ) : (
          <Link to="/login" className="text-sm font-medium text-pit-accent hover:underline">
            Engineer Login
          </Link>
        )}
      </div>
    </header>
  );
}
