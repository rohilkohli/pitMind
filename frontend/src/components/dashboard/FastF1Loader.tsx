import React, { useState } from "react";
import { Database, Loader2, Play } from "lucide-react";
import { postLoadFastF1, type TelemetryPayload } from "../../services/api";
import { auth } from "../../lib/firebase";

interface FastF1LoaderProps {
  onDataLoaded: (payload: TelemetryPayload) => void;
}

export const FastF1Loader: React.FC<FastF1LoaderProps> = ({ onDataLoaded }) => {
  const [year, setYear] = useState(2023);
  const [event, setEvent] = useState("Monza");
  const [sessionType, setSessionType] = useState<"R" | "Q" | "S" | "FP1" | "FP2" | "FP3">("R");
  const [driver, setDriver] = useState("VER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoad = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await auth?.currentUser?.getIdToken();
      const data = await postLoadFastF1(
        {
          year,
          event,
          session_type: sessionType,
          driver_code: driver,
        },
        token,
      );
      onDataLoaded(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to load FastF1 data");
      if (import.meta.env.DEV) {
        console.error("FastF1 Load Error:", error);
      }
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="pm-panel-header" style={{ marginBottom: 12 }}>
        <div className="pm-panel-title flex items-center gap-2">
          <Database className="w-4 h-4 text-[var(--f1-red)]" />
          REAL-SESSION DATA (FastF1)
        </div>
      </div>
      <div className="flex flex-col gap-0">
        <div className="grid grid-cols-2 gap-3 mb-1">
          <div className="space-y-1.5">
            <label className="font-label tracking-widest text-[10px] text-[var(--text-secondary)] uppercase">
              Year
            </label>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="w-full"
            >
              {[2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="font-label tracking-widest text-[10px] text-[var(--text-secondary)] uppercase">
              Driver
            </label>
            <input
              value={driver}
              onChange={(e) => setDriver(e.target.value.toUpperCase())}
              placeholder="VER"
              className="w-full bg-[var(--carbon-mid)] border border-[var(--border)] text-[13px] text-[var(--text-primary)] p-2 focus:border-[var(--f1-red)] outline-none font-tele uppercase"
            />
          </div>
          <div className="space-y-1.5">
            <label className="font-label tracking-widest text-[10px] text-[var(--text-secondary)] uppercase">
              Event
            </label>
            <input
              value={event}
              onChange={(e) => setEvent(e.target.value)}
              placeholder="Monza"
              className="w-full bg-[var(--carbon-mid)] border border-[var(--border)] text-[13px] text-[var(--text-primary)] p-2 focus:border-[var(--f1-red)] outline-none font-tele uppercase"
            />
          </div>
          <div className="space-y-1.5">
            <label className="font-label tracking-widest text-[10px] text-[var(--text-secondary)] uppercase">
              Session
            </label>
            <select
              value={sessionType}
              onChange={(e) => setSessionType(e.target.value as "R" | "Q" | "S" | "FP1" | "FP2" | "FP3")}
              className="w-full"
            >
              <option value="R">Race</option>
              <option value="Q">Qualifying</option>
              <option value="S">Sprint</option>
              <option value="FP1">Practice 1</option>
              <option value="FP2">Practice 2</option>
              <option value="FP3">Practice 3</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleLoad}
          disabled={loading}
          className="pm-btn-primary w-full mt-4 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>BOOTSTRAPPING...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>PULL OFFICIAL DATA</span>
            </>
          )}
        </button>

        {error && (
          <p className="mt-4 text-[10px] text-[var(--f1-red)] uppercase font-tele text-center bg-[var(--f1-red-dim)] py-2 border border-[var(--f1-red)]">
            {error}
          </p>
        )}

        <p className="mt-4 pt-3 text-[10px] text-[var(--text-secondary)] leading-loose uppercase font-tele italic border-t border-[var(--border)]">
          Note: Outbound connection required. First load of an event may take 30-60s to bootstrap
          the F1 timing cache.
        </p>
      </div>
    </div>
  );
};
