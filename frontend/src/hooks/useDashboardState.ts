import { useCallback, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export interface DashboardState {
  driverFilter?: string;
  lapRange?: [number, number];
  strategyFilters?: {
    minConfidence?: number;
    showAlternatives?: boolean;
    compoundFilter?: string[];
  };
  selectedMetrics?: string[];
  timeFilter?: string; // 'all' | 'live' | 'last_10'
}

/**
 * Encodes dashboard state into a URL-safe query string
 */
export function encodeDashboardState(state: DashboardState): string {
  const params = new URLSearchParams();

  if (state.driverFilter) {
    params.set("driver", state.driverFilter);
  }

  if (state.lapRange) {
    params.set("laps", `${state.lapRange[0]}-${state.lapRange[1]}`);
  }

  if (state.strategyFilters) {
    if (state.strategyFilters.minConfidence !== undefined) {
      params.set("minConf", String(state.strategyFilters.minConfidence));
    }
    if (state.strategyFilters.showAlternatives !== undefined) {
      params.set("showAlt", String(state.strategyFilters.showAlternatives));
    }
    if (state.strategyFilters.compoundFilter?.length) {
      params.set("compounds", state.strategyFilters.compoundFilter.join(","));
    }
  }

  if (state.selectedMetrics?.length) {
    params.set("metrics", state.selectedMetrics.join(","));
  }

  if (state.timeFilter) {
    params.set("time", state.timeFilter);
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

/**
 * Decodes a URL query string back into dashboard state
 */
function decodeDashboardState(queryString: string): DashboardState {
  const params = new URLSearchParams(queryString);
  const state: DashboardState = {};

  const driver = params.get("driver");
  if (driver) state.driverFilter = driver;

  const laps = params.get("laps");
  if (laps) {
    const [start, end] = laps.split("-").map(Number);
    if (!isNaN(start) && !isNaN(end)) {
      state.lapRange = [start, end];
    }
  }

  const minConf = params.get("minConf");
  const showAlt = params.get("showAlt");
  const compounds = params.get("compounds");

  if (minConf || showAlt || compounds) {
    state.strategyFilters = {};
    if (minConf) state.strategyFilters.minConfidence = Number(minConf);
    if (showAlt) state.strategyFilters.showAlternatives = showAlt === "true";
    if (compounds) state.strategyFilters.compoundFilter = compounds.split(",");
  }

  const metrics = params.get("metrics");
  if (metrics) {
    state.selectedMetrics = metrics.split(",");
  }

  const time = params.get("time");
  if (time) state.timeFilter = time;

  return state;
}

/**
 * Custom hook for managing dashboard state with URL synchronization
 */
export function useDashboardState(initialState: DashboardState = {}) {
  const location = useLocation();
  const navigate = useNavigate();

  // Initialize state from URL or provided initial state
  const [state, setState] = useState<DashboardState>(() => {
    const urlState = decodeDashboardState(location.search);
    return Object.keys(urlState).length > 0 ? urlState : initialState;
  });

  // Sync state to URL whenever it changes
  const updateState = useCallback(
    (newState: DashboardState | ((prev: DashboardState) => DashboardState)) => {
      setState((prev) => {
        const updated = typeof newState === "function" ? newState(prev) : newState;
        const queryString = encodeDashboardState(updated);
        navigate({ search: queryString }, { replace: true });
        return updated;
      });
    },
    [navigate],
  );

  // Generate shareable URL
  const getShareableUrl = useCallback((): string => {
    const baseUrl = window.location.origin + window.location.pathname;
    const queryString = encodeDashboardState(state);
    return baseUrl + queryString;
  }, [state]);

  // Copy shareable URL to clipboard
  const copyShareableUrl = useCallback(async (): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(getShareableUrl());
      return true;
    } catch (err) {
      console.error("Failed to copy URL:", err);
      return false;
    }
  }, [getShareableUrl]);

  return {
    state,
    updateState,
    getShareableUrl,
    copyShareableUrl,
  };
}
