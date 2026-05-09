import { Link, useLocation } from "react-router-dom";

export function BottomNav() {
  const location = useLocation();
  const path = location.pathname;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-14 items-center justify-around border-t border-pit-stroke bg-carbon text-pit-muted md:hidden">
      <Link 
        to="/dashboard" 
        className={`flex h-11 w-11 flex-col items-center justify-center rounded-md ${path.includes("dashboard") ? "text-pit-info border-t-2 border-pit-info" : ""}`}
        aria-label="Dashboard"
      >
        <span className="text-xl">📊</span>
      </Link>
      <Link 
        to="/copilot" 
        className={`flex h-11 w-11 flex-col items-center justify-center rounded-md ${path.includes("copilot") ? "text-pit-info border-t-2 border-pit-info" : ""}`}
        aria-label="Copilot"
      >
        <span className="text-xl">🤖</span>
      </Link>
      <Link 
        to="/fan" 
        className={`flex h-11 w-11 flex-col items-center justify-center rounded-md ${path.includes("fan") ? "text-pit-info border-t-2 border-pit-info" : ""}`}
        aria-label="Fan Mode"
      >
        <span className="text-xl">👥</span>
      </Link>
    </nav>
  );
}
