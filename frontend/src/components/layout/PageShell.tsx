import type { ReactNode } from "react";
import { NavBar } from "./NavBar";
import { BottomNav } from "./BottomNav";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col overflow-hidden bg-carbon text-pit-fg">
      <NavBar />
      <main className="flex-1 overflow-hidden pb-14 md:pb-0">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
