import { useState } from "react";
import { useFirebaseRaceState } from "../hooks/useFirebaseRaceState";
import { KpiStrip } from "../components/dashboard/KpiStrip";
import { StandingsTable } from "../components/dashboard/StandingsTable";
import { LapChart } from "../components/dashboard/LapChart";
import { StrategyTimeline } from "../components/dashboard/StrategyTimeline";
import { useTelemetry } from "../hooks/useTelemetry";
import { demoDriverA } from "../data/demoTelemetry";
import { postRecommend, postChat, type StrategyRecommendation } from "../services/api";
import { Button } from "../components/ui/button";
import { auth } from "../lib/firebase";

export function Dashboard() {
  const { raceState } = useFirebaseRaceState("current_race");
  
  // Local telemetry state (for demo / upload purposes as built in step 1)
  const { payload } = useTelemetry(demoDriverA);
  
  const [reco, setReco] = useState<StrategyRecommendation | null>(null);
  const [recoError, setRecoError] = useState<string | null>(null);
  const [recoLoading, setRecoLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [chat, setChat] = useState<{ role: "user" | "assistant"; content: string }[]>([
    { role: "assistant", content: "PitMind Copilot initialized. How can I help analyze the strategy?" },
  ]);

  async function onRecommend() {
    setRecoLoading(true);
    setRecoError(null);
    try {
      const token = await auth?.currentUser?.getIdToken();
      const data = await postRecommend(payload, token);
      setReco(data);
    } catch (e) {
      console.error(e);
      setRecoError(String(e));
    } finally {
      setRecoLoading(false);
    }
  }

  async function onSendChat() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    const next = [...chat, { role: "user" as const, content: trimmed }];
    setDraft("");
    setChat(next);
    try {
      const token = await auth?.currentUser?.getIdToken();
      const ctx = { recommendation: reco, telemetry: { laps: payload.laps.length, circuit: payload.circuit } };
      const { reply } = await postChat(next, ctx, token);
      setChat([...next, { role: "assistant", content: reply }]);
    } catch (e) {
      setChat([...next, { role: "assistant", content: `Error: ${String(e)}` }]);
    }
  }

  return (
    <div className="flex h-[calc(100vh-48px)] flex-col">
      {/* Top Strip */}
      <div className="border-b border-pit-stroke">
        <KpiStrip raceState={raceState} />
      </div>

      {/* Main 3-column layout */}
      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        
        {/* Left Col: Standings */}
        <div className="w-full border-r border-pit-stroke md:w-[30%]">
          <StandingsTable standings={raceState?.standings} />
        </div>
        
        {/* Middle Col: Telemetry Chart */}
        <div className="w-full border-r border-pit-stroke md:w-[40%] flex flex-col">
          <LapChart />
          {/* Action strip */}
          <div className="border-t border-pit-stroke bg-black/40 p-4">
            <Button 
              onClick={onRecommend} 
              disabled={recoLoading}
              className="w-full bg-pit-accent hover:bg-pit-accent/80"
            >
              {recoLoading ? "Analyzing..." : "Generate AI Strategy"}
            </Button>
            {recoError && (
              <p className="mt-2 text-xs text-red-400">{recoError}</p>
            )}
          </div>
        </div>

        {/* Right Col: AI Reasoning & Chat */}
        <div className="flex w-full flex-col md:w-[30%]">
          <div className="flex-1 overflow-hidden border-b border-pit-stroke">
            <StrategyTimeline reco={reco} />
          </div>
          
          <div className="flex h-1/2 flex-col bg-black/20">
            <div className="sticky top-0 bg-carbon/90 pb-2 pt-4 backdrop-blur">
              <h2 className="px-4 text-[11px] font-semibold uppercase tracking-widest text-pit-muted">Copilot Chat</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chat.map((m, idx) => (
                <div key={`${idx}-${m.role}`} className="text-sm">
                  <p className={`font-semibold ${m.role === 'user' ? 'text-pit-fg' : 'text-pit-accent'}`}>
                    {m.role === 'user' ? 'You' : 'PitMind AI'}
                  </p>
                  <p className="text-pit-fg mt-1">{m.content}</p>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-pit-stroke bg-carbon">
              <div className="flex gap-2">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && onSendChat()}
                  placeholder="Ask about tyre deg..."
                  className="w-full rounded-md border border-pit-stroke bg-black/60 px-3 py-2 text-sm text-pit-fg focus-ring"
                />
                <Button onClick={onSendChat} variant="secondary">Send</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
