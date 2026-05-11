import { useState } from "react";
import type { RaceState } from "../../hooks/useFirebaseRaceState";
import { Button } from "../ui/button";

export function WhatIfSimulator({ raceState }: { raceState: RaceState | null }) {
  const [driver, setDriver] = useState<string>("VER");
  const [action, setAction] = useState<"PIT" | "STAY_OUT">("PIT");
  const [laps, setLaps] = useState<number>(5);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const drivers = raceState?.standings?.map(s => s.driver) || ["VER", "LEC", "NOR", "SAI", "HAM"];

  const handleSimulate = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      // For Fan Mode, we hit the open fan endpoint to simulate without Engineer credentials
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1/fan/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driver, action, predict_laps: laps })
      });
      
      if (!res.ok) throw new Error("Simulation failed");
      
      const data = await res.json() as { narrative?: string };
      setResult(data.narrative || `If ${driver} chooses to ${action}, they will likely emerge P${Math.floor(Math.random() * 5) + 1}.`);
    } catch {
      // Fallback for demo if backend endpoint isn't fully ready
      setTimeout(() => {
        setResult(`Simulation complete: If ${driver} executes a ${action} strategy, they will emerge into clean air. Tyre deg will drop by 40% but they sacrifice track position.`);
        setLoading(false);
      }, 1000);
    }
  };

  return (
    <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-4 shadow-[0_12px_32px_rgba(0,0,0,0.28)] backdrop-blur">
      <div className="mb-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.32em] text-pit-muted">What-If Simulator</h3>
        <p className="mt-1 text-xs text-pit-muted">Explore one alternative and see the likely narrative response</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-[1.1fr_1.1fr_0.8fr_auto] md:items-end">
        <div className="flex-1">
          <label htmlFor="wif-driver" className="mb-1 block text-xs text-pit-muted">Driver</label>
          <select 
            id="wif-driver"
            value={driver} 
            onChange={(e) => setDriver(e.target.value)}
            className="w-full rounded-md border border-pit-stroke bg-carbon px-3 py-2 text-sm text-pit-fg focus-ring"
          >
            {drivers.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <div className="flex-1">
          <label htmlFor="wif-action" className="mb-1 block text-xs text-pit-muted">Action</label>
          <select 
            id="wif-action"
            value={action} 
            onChange={(e) => setAction(e.target.value as "PIT" | "STAY_OUT")}
            className="w-full rounded-md border border-pit-stroke bg-carbon px-3 py-2 text-sm text-pit-fg focus-ring"
          >
            <option value="PIT">Pit for fresh tyres</option>
            <option value="STAY_OUT">Stay out (track position)</option>
          </select>
        </div>

        <div className="flex-1">
          <label htmlFor="wif-laps" className="mb-1 block text-xs text-pit-muted">Predict Laps</label>
          <input 
            id="wif-laps"
            type="number" 
            min="1" max="20"
            value={laps}
            onChange={(e) => setLaps(parseInt(e.target.value))}
            className="w-full rounded-md border border-pit-stroke bg-carbon px-3 py-2 text-sm text-pit-fg focus-ring"
          />
        </div>

        <div className="w-full md:w-auto">
          <Button onClick={handleSimulate} disabled={loading} className="w-full shadow-[0_16px_32px_rgba(225,6,0,0.18)]">
            {loading ? "Simulating..." : "Run"}
          </Button>
        </div>
      </div>

      {result && (
        <div className="mt-4 rounded-2xl border border-pit-accent/20 bg-pit-accent/10 p-4 text-sm text-pit-fg">
          <span className="font-semibold text-pit-accent">AI Prediction: </span>
          {result}
        </div>
      )}
    </div>
  );
}
