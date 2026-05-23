import { useCallback, useMemo, useState } from "react";

import type { LapPoint, TelemetryPayload } from "@/services/api";

export function useTelemetry(initial: TelemetryPayload) {
  const [payload, setPayload] = useState<TelemetryPayload>(initial);

  const upsertLive = useCallback(
    (sample: { lap: number; lap_time_s: number; tyre_wear_pct: number }) => {
      setPayload((p) => {
        const laps = [...p.laps];
        const idx = laps.findIndex((l) => l.lap === sample.lap);
        const row: LapPoint = {
          lap: sample.lap,
          lap_time_s: sample.lap_time_s,
          tyre_wear_pct: sample.tyre_wear_pct,
        };
        if (idx >= 0) laps[idx] = { ...laps[idx], ...row };
        else laps.push(row);
        laps.sort((a, b) => a.lap - b.lap);
        return { ...p, laps };
      });
    },
    [],
  );

  const metrics = useMemo(() => {
    const laps = [...payload.laps].sort((a, b) => a.lap - b.lap);
    const wearSeries = laps.map((l) => ({ lap: l.lap, wear: l.tyre_wear_pct ?? null }));
    const gapSeries = laps.map((l) => ({ lap: l.lap, gap: l.gap_ahead_s ?? null }));
    const sectors = laps.map((l) => ({
      lap: l.lap,
      s1: l.sector1_s ?? null,
      s2: l.sector2_s ?? null,
      s3: l.sector3_s ?? null,
    }));
    return { wearSeries, gapSeries, sectors, laps };
  }, [payload]);

  return { payload, setPayload, upsertLive, metrics };
}
