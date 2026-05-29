import { useState, useCallback, useEffect } from "react";

interface UsePanelStateOptions {
  id: string; // unique panel identifier, used as localStorage key
  defaultCollapsed?: boolean;
  persist?: boolean; // if true, remember state across page refreshes
}

interface UsePanelStateReturn {
  isCollapsed: boolean;
  toggle: () => void;
  collapse: () => void;
  expand: () => void;
}

export function usePanelState({
  id,
  defaultCollapsed = false,
  persist = true,
}: UsePanelStateOptions): UsePanelStateReturn {
  const storageKey = `pitmind_panel_${id}`;

  const getInitialState = (): boolean => {
    if (persist && typeof window !== "undefined") {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) return stored === "true";
    }
    return defaultCollapsed;
  };

  const [isCollapsed, setIsCollapsed] = useState<boolean>(getInitialState);

  useEffect(() => {
    if (persist) {
      localStorage.setItem(storageKey, String(isCollapsed));
    }
  }, [isCollapsed, persist, storageKey]);

  // Listen for storage events so collapseAll/expandAll can sync all panels
  useEffect(() => {
    const handleStorage = () => {
      if (persist) {
        const stored = localStorage.getItem(storageKey);
        if (stored !== null) setIsCollapsed(stored === "true");
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [storageKey, persist]);

  const toggle = useCallback(() => setIsCollapsed((prev) => !prev), []);
  const collapse = useCallback(() => setIsCollapsed(true), []);
  const expand = useCallback(() => setIsCollapsed(false), []);

  return { isCollapsed, toggle, collapse, expand };
}
