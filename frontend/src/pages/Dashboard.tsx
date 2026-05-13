import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useFirebaseRaceState } from "../hooks/useFirebaseRaceState";
import { useDashboardState } from "../hooks/useDashboardState";
import { useRole } from "../contexts/RoleContext";
import { KpiStrip } from "../components/dashboard/KpiStrip";
import { StandingsTable } from "../components/dashboard/StandingsTable";
import { StrategyTimeline } from "../components/dashboard/StrategyTimeline";
import { EventTimeline } from "../components/dashboard/EventTimeline";
import { ConfidenceDecompositionCard } from "../components/dashboard/ConfidenceDecompositionCard";
import { ShareButton } from "../components/dashboard/ShareButton";
import { RoleSwitcher } from "../components/dashboard/RoleSwitcher";
import { StreamHealthMonitor } from "../components/dashboard/StreamHealthMonitor";
import { useTelemetry } from "../hooks/useTelemetry";
import { demoDriverA } from "../data/demoTelemetry";
import { postRecommend, postChat, type StrategyRecommendation } from "../services/api";
import { Button } from "../components/ui/button";
import { auth } from "../lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";

// Lazy load heavy components
const LapChart = lazy(() => import("../components/dashboard/LapChart").then((module) => ({ default: module.LapChart })));
const BranchingSimulator = lazy(() => import("../components/dashboard/BranchingSimulator").then((module) => ({ default: module.BranchingSimulator })));
const DecisionLog = lazy(() => import("../components/dashboard/DecisionLog").then((module) => ({ default: module.DecisionLog })));
const FanBattleCards = lazy(() => import("../components/dashboard/FanBattleCards").then((module) => ({ default: module.FanBattleCards })));
const HealthConsole = lazy(() => import("../components/dashboard/HealthConsole").then((module) => ({ default: module.HealthConsole })));

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
};

export function Dashboard() {
  const { raceState } = useFirebaseRaceState("current_race");
  const { currentRole, setRole } = useRole();
  const { getShareableUrl, copyShareableUrl } = useDashboardState({
    timeFilter: 'live',
  });
  
  // Local telemetry state (for demo / upload purposes as built in step 1)
  const { payload } = useTelemetry(demoDriverA);
  
  const [reco, setReco] = useState<StrategyRecommendation | null>(null);
  const [recoError, setRecoError] = useState<string | null>(null);
  const [recoLoading, setRecoLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [chat, setChat] = useState<ChatMessage[]>([
    { id: "assistant-welcome", role: "assistant", content: "PitMind Copilot initialized. How can I help analyze the strategy?" },
  ]);
  const [isChatThinking, setIsChatThinking] = useState(false);
  const streamTimerRef = useRef<number | null>(null);

  const promptChips = [
    "What is the undercut risk?",
    "Show the next pit window.",
    "Explain the confidence drop.",
    "Compare tyre life vs pace.",
  ];

  useEffect(() => {
    return () => {
      if (streamTimerRef.current !== null) {
        window.clearInterval(streamTimerRef.current);
      }
    };
  }, []);

  function stopStreamTimer() {
    if (streamTimerRef.current !== null) {
      window.clearInterval(streamTimerRef.current);
      streamTimerRef.current = null;
    }
  }

  function streamAssistantReply(messageId: string, reply: string) {
    return new Promise<void>((resolve) => {
      stopStreamTimer();

      let index = 0;
      const stepSize = Math.max(1, Math.ceil(reply.length / 42));

      const tick = () => {
        index = Math.min(reply.length, index + stepSize);

        setChat((current) =>
          current.map((message) =>
            message.id === messageId
              ? { ...message, content: reply.slice(0, index), streaming: index < reply.length }
              : message,
          ),
        );

        if (index >= reply.length) {
          stopStreamTimer();
          resolve();
        }
      };

      tick();
      streamTimerRef.current = window.setInterval(tick, 18);
    });
  }

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

    if (isChatThinking) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
    };
    const assistantMessageId = `assistant-${Date.now()}`;
    const next = [...chat, userMessage];
    setDraft("");
    setChat([...next, { id: assistantMessageId, role: "assistant", content: "Thinking...", streaming: true }]);
    setIsChatThinking(true);
    try {
      const token = await auth?.currentUser?.getIdToken();
      const ctx = { recommendation: reco, telemetry: { laps: payload.laps.length, circuit: payload.circuit } };
      const { reply } = await postChat(next, ctx, token);
      await streamAssistantReply(assistantMessageId, reply);
    } catch (e) {
      await streamAssistantReply(assistantMessageId, `Error: ${String(e)}`);
    } finally {
      setIsChatThinking(false);
    }
  }

  return (
    <div className="relative mx-auto flex min-h-[calc(100vh-56px)] max-w-[1600px] flex-col gap-4 px-4 py-4 lg:px-6">
      {/* Race Header Banner */}
      <div className="f1-card border-b-3 border-f1-red p-0 overflow-hidden">
        <div className="f1-stripe" />
        <CardContent className="grid gap-4 p-4 lg:grid-cols-[1.2fr_auto] lg:items-center">
          <div>
            <p className="text-f1-muted text-xs font-bold uppercase tracking-widest">RACE STRATEGY</p>
            <h1 className="mt-2 text-3xl font-display font-black uppercase text-f1-white md:text-4xl">Monaco Grand Prix</h1>
            <p className="mt-2 max-w-2xl text-sm text-f1-secondary">
              Real-time strategy analysis for race engineers.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <RoleSwitcher currentRole={currentRole} onRoleChange={setRole} />
              <ShareButton onCopyUrl={copyShareableUrl} getShareUrl={getShareableUrl} />
            </div>
            <StreamHealthMonitor showMetrics={true} />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="border-l-4 border-f1-red bg-f1-dark px-3 py-2">
                <div className="text-f1-muted text-xs font-bold uppercase tracking-widest">Session</div>
                <div className="mt-1 font-display text-lg font-black text-f1-white">{raceState?.session_status ?? "LIVE"}</div>
              </div>
              <div className="border-l-4 border-f1-red bg-f1-dark px-3 py-2">
                <div className="text-f1-muted text-xs font-bold uppercase tracking-widest">Telemetry</div>
                <div className="mt-1 font-display text-lg font-black text-f1-white">{payload.laps.length}</div>
              </div>
              <div className="border-l-4 border-f1-red bg-f1-dark px-3 py-2">
                <div className="text-f1-muted text-xs font-bold uppercase tracking-widest">Strategy</div>
                <div className="mt-1 font-display text-lg font-black text-f1-white truncate">{reco?.action ?? "—"}</div>
              </div>
              <div className="border-l-4 border-f1-red bg-f1-dark px-3 py-2">
                <div className="text-f1-muted text-xs font-bold uppercase tracking-widest">Confidence</div>
                <div className="mt-1 font-display text-lg font-black text-f1-white">{reco ? `${reco.confidence.toFixed(0)}%` : "—"}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </div>

      {raceState ? <KpiStrip raceState={raceState} /> : (
        <div className="grid gap-3 md:grid-cols-4">
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-3 h-8 w-28" />
              <Skeleton className="mt-3 h-2 w-full" />
            </div>
          ))}
        </div>
      )}

      <div className="grid flex-1 gap-4 xl:grid-cols-[300px_minmax(0,1fr)_380px]">
        <Card className="flex min-h-0 flex-col overflow-hidden border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle>Standings</CardTitle>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 p-0">
            <StandingsTable standings={raceState?.standings} />
          </CardContent>
        </Card>

        <div className="flex min-h-0 flex-col gap-4">
          <Card className="overflow-hidden border-white/10 bg-white/5">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle>Telemetry</CardTitle>
              <div className="flex gap-2">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-f1-muted">Monza</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-f1-muted">Live view</span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {payload.laps.length > 0 ? (
                <Suspense
                  fallback={
                    <div className="flex min-h-[420px] items-center justify-center p-6">
                      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-6 text-center">
                        <Skeleton className="mx-auto h-3 w-24" />
                        <Skeleton className="mx-auto mt-4 h-8 w-40" />
                        <Skeleton className="mt-6 h-[280px] w-full rounded-2xl" />
                      </div>
                    </div>
                  }
                >
                  <LapChart />
                </Suspense>
              ) : (
                <div className="flex min-h-[420px] items-center justify-center p-6 text-center">
                  <div>
                    <p className="text-sm font-medium text-white">No telemetry loaded yet</p>
                    <p className="mt-1 text-xs text-f1-muted">Upload telemetry or wait for the demo source to populate.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5">
            <CardHeader className="flex items-center justify-between gap-4">
              <CardTitle>Strategy action</CardTitle>
              {recoError && <span className="text-xs text-red-300">{recoError}</span>}
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="space-y-1">
                <p className="text-sm text-f1-muted">Generate a new call from the current telemetry snapshot.</p>
                {reco && <p className="text-sm text-white">Last call: <span className="font-semibold text-f1-red">{reco.action}</span></p>}
              </div>
              <Button 
                onClick={onRecommend} 
                disabled={recoLoading}
                className="min-w-[220px] bg-f1-red text-white shadow-[0_18px_40px_rgba(225,6,0,0.24)] hover:bg-f1-red-dark"
              >
                {recoLoading ? "Analyzing strategy..." : "Generate AI Strategy"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="flex min-h-0 flex-col gap-4">
          <Card className="min-h-0 flex-1 overflow-hidden border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle>Strategy Viewer</CardTitle>
            </CardHeader>
            <CardContent className="min-h-0 p-0">
              <StrategyTimeline reco={reco} />
            </CardContent>
          </Card>

          <div className="min-h-0 flex-1 overflow-hidden">
            <ConfidenceDecompositionCard 
              decomposition={reco?.confidence_decomposition} 
              overallConfidence={reco?.confidence ?? 0}
            />
          </div>

          <Card className="flex min-h-[18rem] flex-1 flex-col overflow-hidden border-white/10 bg-white/5">
            <CardHeader className="flex items-center justify-between gap-4">
              <CardTitle>Copilot Chat</CardTitle>
              <span className="rounded-full border border-f1-red/20 bg-f1-red/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.24em] text-f1-red">AI assistant</span>
            </CardHeader>

            <CardContent className="flex min-h-0 flex-1 flex-col p-0">
              <div className="border-b border-white/10 px-4 pb-3 pt-4">
                <div className="flex flex-wrap gap-2">
                  {promptChips.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setDraft(chip)}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-left text-xs text-f1-muted transition-colors hover:border-f1-red/30 hover:bg-f1-red/10 hover:text-white"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {chat.map((m, idx) => (
                  <div
                    key={`${idx}-${m.role}`}
                    className={`max-w-[92%] rounded-2xl border px-4 py-3 text-sm leading-relaxed ${m.role === "user" ? "ml-auto border-white/10 bg-white/8 text-white" : "border-f1-red/20 bg-f1-red/10 text-white"}`}
                  >
                    <p className="mb-1 text-[10px] uppercase tracking-[0.28em] text-f1-muted">
                      {m.role === "user" ? "You" : "PitMind AI"}
                    </p>
                    <p className="whitespace-pre-wrap">
                      {m.content}
                      {m.streaming && <span className="ml-1 inline-block animate-pulse text-f1-red">▍</span>}
                    </p>
                  </div>
                ))}

                {isChatThinking && chat.length > 0 && (
                  <div className="max-w-[92%] rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-relaxed text-white">
                    <p className="mb-1 text-[10px] uppercase tracking-[0.28em] text-f1-muted">PitMind AI</p>
                    <div className="flex items-center gap-2 text-f1-muted">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-f1-red [animation-delay:-0.2s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-f1-red [animation-delay:-0.1s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-f1-red" />
                      <span>Thinking through telemetry and strategy...</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-white/10 p-4">
                <div className="flex gap-2 rounded-2xl border border-white/10 bg-black/20 p-2">
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && onSendChat()}
                    placeholder="Ask about tyre deg, undercut risk, or the next pit window..."
                    className="w-full rounded-xl border-none bg-transparent px-3 py-2 text-sm text-white placeholder:text-f1-muted focus:outline-none focus:ring-2 focus:ring-f1-red/50"
                    disabled={isChatThinking}
                  />
                  <Button onClick={onSendChat} variant="secondary" disabled={isChatThinking}>
                    {isChatThinking ? "Waiting..." : "Send"}
                  </Button>
                </div>
                <p className="mt-2 text-[11px] text-f1-muted">Tip: use the prompt chips to start a focused strategy question.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle>Race Timeline</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <EventTimeline />
        </CardContent>
      </Card>

      {/* Phase 2: Strategy & Analysis */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Suspense fallback={<Card className="border-white/10 bg-white/5 p-6"><Skeleton className="h-64 w-full" /></Card>}>
            <BranchingSimulator currentLap={27} currentPosition={1} currentGap={0.0} />
          </Suspense>
        </div>
        <div>
          <Suspense fallback={<Card className="border-white/10 bg-white/5 p-6"><Skeleton className="h-64 w-full" /></Card>}>
            <FanBattleCards />
          </Suspense>
        </div>
      </div>

      <Suspense fallback={<Card className="border-white/10 bg-white/5 p-6"><Skeleton className="h-96 w-full" /></Card>}>
        <DecisionLog />
      </Suspense>

      {/* Phase 3: Observability & Health */}
      <Suspense fallback={<Card className="border-white/10 bg-white/5 p-6"><Skeleton className="h-96 w-full" /></Card>}>
        <HealthConsole />
      </Suspense>

      {/* Role-based content */}
      {currentRole === 'engineer' && (
        <Card className="border-white/10 bg-white/5 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Engineer Workspace</h3>
          <p className="text-sm text-f1-muted mb-4">
            Real-time telemetry analysis and pit wall decisions. Focus on lap times, tyre management, and strategy execution.
          </p>
          <div className="grid gap-4">
            <div className="p-4 rounded-lg border border-white/10 bg-black/20">
              <div className="font-mono text-sm text-white space-y-2">
                <div>Tyre Strategy: Soft → Hard (lap 28)</div>
                <div>Pit Window: Laps 25–30 (optimal)</div>
                <div>Fuel Target: 1.8 kg/lap</div>
                <div>Next Action: Monitor gap to P2</div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {currentRole === 'strategist' && (
        <Card className="border-white/10 bg-white/5 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Strategist Workspace</h3>
          <p className="text-sm text-f1-muted mb-4">
            Long-term race planning, compound selection, and scenario analysis. Focus on pit windows, undercut/overcut, and weather.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 rounded-lg border border-white/10 bg-black/20">
              <h4 className="font-semibold text-white mb-2">Pit Window Analysis</h4>
              <div className="font-mono text-xs text-white space-y-1">
                <div>Window 1: Laps 12–16 (early)</div>
                <div>Window 2: Laps 25–30 (optimal)</div>
                <div>Window 3: Laps 40–44 (late)</div>
              </div>
            </div>
            <div className="p-4 rounded-lg border border-white/10 bg-black/20">
              <h4 className="font-semibold text-white mb-2">Compound Scenarios</h4>
              <div className="font-mono text-xs text-white space-y-1">
                <div>S-H-H: 2.2% time loss</div>
                <div>S-S-H: 1.5% time loss</div>
                <div>S-H-M: 0.8% time loss</div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {currentRole === 'commentator' && (
        <Card className="border-white/10 bg-white/5 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Commentator Workspace</h3>
          <p className="text-sm text-f1-muted mb-4">
            Race narrative, position battles, and fan engagement. Focus on drama, storylines, and highlights.
          </p>
          <div className="p-4 rounded-lg border border-white/10 bg-black/20">
            <h4 className="font-semibold text-white mb-3">Race Narrative</h4>
            <p className="text-sm text-white leading-relaxed">
              Verstappen dominates from the front, extending his lead lap by lap. Behind him, Leclerc shadows
              closely, waiting for a mistake. The midfield is a hotbed of action, with position swaps every few
              laps. A safety car at lap 38 bunches the field, setting up a thrilling final stint. Will Verstappen's
              fresh tyres hold off the charge from behind, or will this be the comeback story of the race?
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
