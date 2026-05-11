import { Link, useLocation } from "react-router-dom";

export function BottomNav() {
  const location = useLocation();
  const path = location.pathname;

  return (
    <nav className="fixed bottom-3 left-1/2 z-50 flex w-[min(94vw,24rem)] -translate-x-1/2 items-center justify-around rounded-full border border-white/10 bg-carbon/90 px-2 py-2 text-pit-muted shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl md:hidden">
      <Link 
        to="/dashboard" 
        className={`flex h-11 w-11 flex-col items-center justify-center rounded-full transition-colors ${path.includes("dashboard") ? "bg-pit-accent/15 text-pit-accent" : ""}`}
        aria-label="Dashboard"
      >
        <span className="text-xl">📊</span>
      </Link>
      <Link 
        to="/copilot" 
        className={`flex h-11 w-11 flex-col items-center justify-center rounded-full transition-colors ${path.includes("copilot") ? "bg-pit-accent/15 text-pit-accent" : ""}`}
        aria-label="Copilot"
      >
        <span className="text-xl">🤖</span>
      </Link>
      <Link 
        to="/fan" 
        className={`flex h-11 w-11 flex-col items-center justify-center rounded-full transition-colors ${path.includes("fan") ? "bg-pit-accent/15 text-pit-accent" : ""}`}
        aria-label="Fan Mode"
      >
        <span className="text-xl">👥</span>
      </Link>
    </nav>
  );
}
