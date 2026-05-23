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

  useEffect(() => {
    if (!raceId || !database) {
      setLoading(false);
      return;
    }

    const raceRef = ref(database, `races/${raceId}`);

    setLoading(true);

    const unsubscribe = onValue(
      raceRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setRaceState(snapshot.val() as RaceState);
        } else {
          setRaceState(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Firebase DB error:", err);
        setError(err);
        setLoading(false);
      },
    );

    return () => {
      off(raceRef, "value", unsubscribe);
    };
  }, [raceId]);

  return { raceState, loading, error };
}
