import { auth } from "../../lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { Link, useLocation } from "react-router-dom";

export function NavBar() {
  const [user] = useAuthState(auth);
  const location = useLocation();
  const isEngineer = location.pathname.includes("dashboard");

  return (
    <header className="sticky top-0 z-40 border-b border-pit-stroke bg-carbon/85 px-4 backdrop-blur-2xl transition-all duration-300">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/" className="group flex items-center gap-3 transition-all duration-200">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-f1-red/40 bg-f1-red/15 text-sm font-black tracking-widest text-f1-red shadow-glow transition-all duration-200 group-hover:scale-110 group-hover:shadow-glow-lg">
              PM
            </span>
            <div className="leading-tight">
              <p className="text-xs font-bold uppercase tracking-widest text-pit-muted">Strategy Command</p>
              <p className="text-lg font-black text-f1-red">PITMIND</p>
            </div>
          </Link>

          <div className="hidden items-center gap-3 rounded-lg border border-pit-stroke bg-pit-panel/60 px-4 py-2 text-xs text-pit-muted md:flex">
            <span className="h-2 w-2 rounded-full bg-[var(--live-pulse)] shadow-[0_0_16px_rgba(20,184,166,0.8)] animate-pulse" />
            <span className="font-mono font-bold uppercase">Monza - Italian GP</span>
          </div>
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <span className="rounded-lg border border-f1-red/30 bg-f1-red/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-f1-red">Live</span>
          <span className="rounded-lg border border-pit-stroke bg-pit-panel/60 px-4 py-2 font-mono text-base font-bold text-f1-red">LAP 34 / 57</span>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3 rounded-lg border border-pit-stroke bg-pit-panel/60 px-3 py-2">
              <img src={user.photoURL || ""} alt="Avatar" className="h-8 w-8 rounded-full border border-f1-red/30 object-cover" />
              <Link
                to={isEngineer ? "/fan" : "/dashboard"}
                className="text-xs font-bold uppercase tracking-wider text-pit-muted transition-colors duration-200 hover:text-f1-red"
              >
                {isEngineer ? "Fan View" : "Engineer"}
              </Link>
            </div>
          ) : (
            <Link to="/login" className="rounded-lg border border-f1-red/40 bg-f1-red/15 px-5 py-2 text-sm font-bold uppercase tracking-wider text-f1-red transition-all duration-200 hover:shadow-glow-lg">
              Engineer Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
