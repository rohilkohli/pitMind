import type { ReactNode } from "react";
import { NavBar } from "./NavBar";
import { BottomNav } from "./BottomNav";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-f1-black text-f1-white">
      <NavBar />
      <main className="relative flex-1 overflow-hidden pb-16 md:pb-0">{children}</main>
      <BottomNav />
    </div>
  );
}
