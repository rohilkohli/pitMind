import { Link, useLocation } from "react-router-dom";

export function BottomNav() {
  const location = useLocation();
  const path = location.pathname;

  return (
    <nav className="pm-bottom-nav fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-4 py-3 md:hidden">
      <Link
        to="/dashboard"
        className={`flex flex-col items-center gap-1 px-3 py-2 text-xs font-bold uppercase transition-colors ${path.includes("dashboard") ? "border-t-2 border-f1-red text-f1-red" : "text-f1-white hover:text-f1-red"}`}
        aria-label="Dashboard"
      >
        <span className="text-lg">📊</span>
        <span>Dashboard</span>
      </Link>
      <Link
        to="/fan"
        className={`flex flex-col items-center gap-1 px-3 py-2 text-xs font-bold uppercase transition-colors ${path.includes("fan") ? "border-t-2 border-f1-red text-f1-red" : "text-f1-white hover:text-f1-red"}`}
        aria-label="Fan Mode"
      >
        <span className="text-lg">👥</span>
        <span>Fan</span>
      </Link>
      <Link
        to="/login"
        className={`flex flex-col items-center gap-1 px-3 py-2 text-xs font-bold uppercase transition-colors ${path.includes("login") ? "border-t-2 border-f1-red text-f1-red" : "text-f1-white hover:text-f1-red"}`}
        aria-label="Account"
      >
        <span className="text-lg">👤</span>
        <span>Account</span>
      </Link>
    </nav>
  );
}
