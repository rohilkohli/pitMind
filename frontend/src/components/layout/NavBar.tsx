import { useOptionalAuthUser } from "../../hooks/useOptionalAuthUser";
import { Link, useLocation } from "react-router-dom";

// F1 Logo SVG
const F1LogoIcon = () => (
  <svg viewBox="0 0 40 28" fill="none" width="24" height="18" className="text-f1-red">
    <rect width="40" height="28" fill="currentColor" />
    <path d="M6 8h10v4H10v2h5v4H10v6H6V8z" fill="white" />
    <path d="M20 8h8l-8 12h8" stroke="white" strokeWidth="3" fill="none" />
  </svg>
);

export function NavBar() {
  const { user } = useOptionalAuthUser();
  const location = useLocation();
  const isEngineer = location.pathname.includes("dashboard");

  return (
    <header className="sticky top-0 z-40 border-b border-f1-border bg-f1-black/95 px-4 backdrop-blur-md transition-all duration-300">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between gap-6">
        {/* Left: Logo + PITMIND */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center bg-f1-red flex-shrink-0">
              <F1LogoIcon />
            </div>
            <span className="font-display text-lg font-black uppercase text-f1-white tracking-tighter">PitMind</span>
          </Link>

          <div className="hidden md:flex items-center gap-4 ml-4 pl-4 border-l border-f1-border">
            <Link to="/dashboard" className="text-xs font-bold uppercase text-f1-white hover:text-f1-red transition-colors">Dashboard</Link>
            <Link to="/fan" className="text-xs font-bold uppercase text-f1-white hover:text-f1-red transition-colors">Fan Mode</Link>
            <a href="#strategy" className="text-xs font-bold uppercase text-f1-white hover:text-f1-red transition-colors">Strategy</a>
          </div>
        </div>


        {/* Center: Live Badge */}
        <div className="hidden lg:flex items-center gap-2 ml-auto mr-4">
          <div className="f1-live text-xs">
            Live
          </div>
          <span className="text-xs font-mono font-bold text-f1-muted">LAP 34 / 57</span>
        </div>

        {/* Right: Auth + Role Toggle */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {user ? (
            <div className="flex items-center gap-2 px-2 py-1 border border-f1-border bg-f1-dark">
              <img src={user.photoURL || ""} alt="Avatar" className="h-7 w-7 object-cover border border-f1-border" />
              <Link
                to={isEngineer ? "/fan" : "/dashboard"}
                className="text-xs font-bold uppercase text-f1-white hover:text-f1-red transition-colors"
              >
                {isEngineer ? "FAN" : "ENGINEER"}
              </Link>
            </div>
          ) : (
            <Link to="/login" className="f1-btn text-xs py-2 px-4">
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
