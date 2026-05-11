import { auth } from "../../lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { Link, useLocation } from "react-router-dom";

export function NavBar() {
  const [user] = useAuthState(auth);
  const location = useLocation();
  const isEngineer = location.pathname.includes("dashboard");

  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-carbon/75 px-4 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/" className="group flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sm font-black tracking-[0.24em] text-white shadow-[0_0_28px_rgba(225,6,0,0.18)] transition-transform group-hover:scale-105">
              PM
            </span>
            <div className="leading-tight">
              <p className="text-[10px] uppercase tracking-[0.42em] text-pit-muted">Strategy command</p>
              <p className="text-base font-semibold text-pit-fg">PitMind</p>
            </div>
          </Link>

          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-pit-muted md:flex">
            <span className="h-2 w-2 rounded-full bg-[var(--live-pulse)] shadow-[0_0_16px_rgba(20,184,166,0.8)]" />
            Monza - Italian GP
          </div>
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs uppercase tracking-[0.28em] text-pit-muted">Live</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-sm text-pit-fg">LAP 34 / 57</span>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-2 py-1.5 pr-3">
              <img src={user.photoURL || ""} alt="Avatar" className="h-8 w-8 rounded-full border border-white/10 object-cover" />
              <Link
                to={isEngineer ? "/fan" : "/dashboard"}
                className="text-xs font-medium text-pit-muted transition-colors hover:text-pit-fg"
              >
                Switch to {isEngineer ? "Fan View" : "Engineer"}
              </Link>
            </div>
          ) : (
            <Link to="/login" className="rounded-full border border-pit-accent/30 bg-pit-accent/10 px-4 py-2 text-sm font-semibold text-pit-accent transition-colors hover:bg-pit-accent/20">
              Engineer Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
