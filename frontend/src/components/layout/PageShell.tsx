import type { ReactNode } from "react";
import { NavBar } from "./NavBar";
import { BottomNav } from "./BottomNav";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-carbon text-pit-fg">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(225,6,0,0.14),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(20,184,166,0.12),_transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_20%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:56px_56px] opacity-20 [mask-image:linear-gradient(180deg,black,transparent_88%)]" />
      <NavBar />
      <main className="relative flex-1 overflow-hidden pb-16 md:pb-0">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
