import React, { createContext, useContext, useCallback } from "react";

interface PanelStateContextValue {
  collapseAll: (page: string) => void;
  expandAll: (page: string) => void;
}

const PanelStateContext = createContext<PanelStateContextValue | null>(null);

export function PanelStateProvider({ children }: { children: React.ReactNode }) {
  const collapseAll = useCallback((page: string) => {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(`pitmind_panel_${page}__`))
      .forEach((key) => localStorage.setItem(key, "true"));
    window.dispatchEvent(new Event("storage"));
  }, []);

  const expandAll = useCallback((page: string) => {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(`pitmind_panel_${page}__`))
      .forEach((key) => localStorage.setItem(key, "false"));
    window.dispatchEvent(new Event("storage"));
  }, []);

  return (
    <PanelStateContext.Provider value={{ collapseAll, expandAll }}>
      {children}
    </PanelStateContext.Provider>
  );
}

export const usePanelStateContext = () => {
  const ctx = useContext(PanelStateContext);
  if (!ctx) throw new Error("usePanelStateContext must be used inside PanelStateProvider");
  return ctx;
};
