import { useEffect, useState } from "react";
import { ref, onValue, off } from "firebase/database";
import { database } from "../lib/firebase";

export interface DriverState {
  driver: string;
  position: number;
  gap_ahead_s: number | null;
  gap_leader_s: number | null;
  lap: number;
  lap_time_s: number | null;
  tyre_compound: "SOFT" | "MEDIUM" | "HARD" | "INTERMEDIATE" | "WET" | string;
  tyre_age_laps: number;
  team_color: string;
}

export interface RaceState {
  session_status: "LIVE" | "REPLAY" | "PRE-RACE";
  current_lap: number;
  total_laps: number;
  safety_car_active: boolean;
  drs_open: boolean;
  fastest_lap: {
    driver: string;
    lap_time_s: number;
  } | null;
  standings: DriverState[];
}

export function useFirebaseRaceState(raceId: string = "current_race") {
  const [raceState, setRaceState] = useState<RaceState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Demo data for local development
  const demoRaceState: RaceState = {
    session_status: "LIVE",
    current_lap: 27,
    total_laps: 53,
    safety_car_active: false,
    drs_open: true,
    fastest_lap: { driver: "demoDriverA", lap_time_s: 84.5 },
    standings: [
      {
        driver: "demoDriverA",
        position: 1,
        gap_ahead_s: null,
        gap_leader_s: 0,
        lap: 27,
        lap_time_s: 85.2,
        tyre_compound: "SOFT",
        tyre_age_laps: 12,
        team_color: "#EF3340",
      },
      {
        driver: "demoDriverB",
        position: 2,
        gap_ahead_s: 1.234,
        gap_leader_s: 1.234,
        lap: 27,
        lap_time_s: 85.8,
        tyre_compound: "SOFT",
        tyre_age_laps: 11,
        team_color: "#0066FF",
      },
    ],
  };

  useEffect(() => {
    if (!raceId) return;

    // Check if in demo mode
    const isDemoMode = typeof window !== "undefined" && localStorage.getItem("demoMode") === "true";
    
    // If demo mode, use demo data immediately
    if (isDemoMode) {
      setRaceState(demoRaceState);
      setLoading(false);
      return;
    }

    const raceRef = ref(database, `races/${raceId}`);
    
    setLoading(true);
    
    // Set timeout to use demo data if Firebase doesn't respond
    const timeoutId = setTimeout(() => {
      console.warn("Firebase timeout - using demo data");
      setRaceState(demoRaceState);
      setLoading(false);
    }, 3000);
    
    const unsubscribe = onValue(
      raceRef,
      (snapshot) => {
        clearTimeout(timeoutId);
        if (snapshot.exists()) {
          setRaceState(snapshot.val() as RaceState);
        } else {
          setRaceState(demoRaceState);
        }
        setLoading(false);
      },
      (err) => {
        clearTimeout(timeoutId);
        console.error("Firebase DB error:", err);
        // Use demo data on error
        setRaceState(demoRaceState);
        setLoading(false);
      }
    );

    return () => {
      clearTimeout(timeoutId);
      off(raceRef, "value", unsubscribe);
    };
  }, [raceId]);

  return { raceState, loading, error };
}
