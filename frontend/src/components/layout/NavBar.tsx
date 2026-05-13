import { useOptionalAuthUser } from "../../hooks/useOptionalAuthUser";
import { Link, useLocation } from "react-router-dom";

// F1-style Logo SVG (Premium Path)
const F1LogoIcon = () => (
  <svg viewBox="0 0 100 40" fill="none" width="48" height="18" className="text-f1-red">
    <path 
      d="M0 40L15 40L25 0L10 0L0 40ZM35 15L45 15L48 5L38 5L35 15ZM32 25L42 25L45 15L35 15L32 25ZM29 35L39 35L42 25L32 25L29 35ZM55 40L95 40C100 40 100 35 100 35L100 30L60 30L63 20L100 20L100 15C100 15 100 10 95 10L65 10L68 0L100 0L100 0L58 0L46 40L55 40Z" 
      fill="currentColor" 
    />
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
