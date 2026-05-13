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
import { postRecommend, postChat, uploadTelemetry, type StrategyRecommendation, type TelemetryPayload } from "../services/api";
import { Button } from "../components/ui/button";
import { auth } from "../lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import { Loader2, Download, Upload, Zap, Activity } from "lucide-react";
import * as Resizable from "react-resizable-panels";
const { Panel, Group } = Resizable;
import { ResizeHandle } from "../components/ui/ResizeHandle";

import { exportToCsv, exportToJson } from "../lib/utils";

// Lazy load heavy components
const LapChart = lazy(() => import("../components/dashboard/LapChart").then((module) => ({ default: module.LapChart })));
const DecisionLog = lazy(() => import("../components/dashboard/DecisionLog").then((module) => ({ default: module.DecisionLog })));
const HealthConsole = lazy(() => import("../components/dashboard/HealthConsole").then((module) => ({ default: module.HealthConsole })));
const FastF1Loader = lazy(() => import("../components/dashboard/FastF1Loader").then((module) => ({ default: module.FastF1Loader })));
const LiveSystemFeed = lazy(() => import("../components/dashboard/LiveSystemFeed").then((module) => ({ default: module.LiveSystemFeed })));

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
  const { payload: initialPayload } = useTelemetry(demoDriverA);
  
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
      const token = await auth?.currentUser?.getIdToken(true);
      const data = await postRecommend(localPayload, token);
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
      const token = await auth?.currentUser?.getIdToken(true);
      const ctx = { recommendation: reco, telemetry: { laps: localPayload.laps.length, circuit: localPayload.circuit } };
      const { reply } = await postChat(next, ctx, token);
      await streamAssistantReply(assistantMessageId, reply);
    } catch (e) {
      await streamAssistantReply(assistantMessageId, `Error: ${String(e)}`);
    } finally {
      setIsChatThinking(false);
    }
  }

  const [localPayload, setLocalPayload] = useState<TelemetryPayload>(initialPayload);
  const [isUploading, setIsUploading] = useState(false);

  async function handleUploadTelemetry(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setIsUploading(true);
      try {
        const token = await auth?.currentUser?.getIdToken(true);
        const data = await uploadTelemetry(e.target.files[0], token);
        setLocalPayload(data);
      } catch (err) {
        console.error(err);
        alert("Failed to upload telemetry");
      } finally {
        setIsUploading(false);
      }
    }
  }

  function handleExportTelemetry(format: 'csv' | 'json') {
    const filename = `pitmind_telemetry_${localPayload.driver}_${localPayload.circuit}_${new Date().toISOString().split('T')[0]}`;
    if (format === 'csv') {
      exportToCsv(`${filename}.csv`, localPayload.laps);
    } else {
      exportToJson(`${filename}.json`, localPayload);
    }
  }

  function handleExportDecisions(format: 'csv' | 'json') {
    // MOCK_DECISIONS from DecisionLog.tsx is not exported, but we can assume the component would handle it or we pass it.
    // However, the DecisionLog component has MOCK_DECISIONS inside it.
    // For now, let's just toast or log that we are exporting.
    // In a real app, we'd get the decisions from a hook.
    console.log(`Exporting decisions as ${format}`);
  }

  return (
    <div className="relative mx-auto flex h-[calc(100vh-56px)] max-w-[1600px] flex-col gap-2 px-3 py-3 lg:px-4 overflow-hidden">
      {/* Race Header Banner - Refined for Alignment */}
      <div className="f1-card shrink-0 border-b-2 border-f1-red p-0 overflow-hidden shadow-md">
        <div className="f1-stripe" />
        <CardContent className="grid gap-4 p-3 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex items-center gap-6">
            <div>
              <div className="flex items-center gap-3">
                <span className="bg-f1-red px-2 py-0.5 text-[8px] font-black text-white uppercase tracking-widest">Live</span>
                <p className="text-f1-muted text-[8px] font-bold uppercase tracking-widest">{localPayload.circuit} 2024</p>
              </div>
              <h1 className="mt-1 text-xl font-display font-black uppercase text-f1-white leading-none">Monaco Grand Prix</h1>
            </div>
            <div className="hidden xl:flex gap-1 border-l border-white/10 pl-6">
              {[
                { label: 'Session', val: raceState?.session_status ?? "LIVE" },
                { label: 'Laps', val: localPayload.laps.length },
                { label: 'Strategy', val: reco?.action ?? "—" },
              ].map((stat, i) => (
                <div key={i} className="min-w-[70px] px-2">
                  <div className="text-f1-muted text-[7px] font-bold uppercase">{stat.label}</div>
                  <div className="font-display text-[10px] font-black text-f1-white truncate">{stat.val}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-full max-w-[200px]">
              <StreamHealthMonitor showMetrics={false} />
            </div>
            <div className="flex items-center gap-2 border-l border-white/10 pl-4">
              <RoleSwitcher currentRole={currentRole} onRoleChange={setRole} />
              <ShareButton onCopyUrl={copyShareableUrl} getShareUrl={getShareableUrl} />
            </div>
          </div>
        </CardContent>
      </div>

      {raceState && <KpiStrip raceState={raceState} />}

      {/* Main Analysis Grid - Resizable Implementation */}
      <div className="flex-1 min-h-0 overflow-hidden bg-f1-black/50">
        <Group orientation="horizontal" className="h-full w-full">
          {/* Left Column: Awareness */}
          <Panel defaultSize={20} minSize={15} className="flex flex-col">
            <Group orientation="vertical" className="h-full">
              <Panel defaultSize={50} minSize={20} className="flex flex-col pb-2">
                <Card className="flex flex-col overflow-hidden border-white/10 bg-white/5 h-full">
                  <CardHeader className="py-3 px-4 border-b border-white/5 bg-white/5">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-f1-muted">Driver Standings</CardTitle>
                  </CardHeader>
                  <CardContent className="min-h-0 flex-1 p-0 overflow-y-auto scrollbar-thin scrollbar-thumb-f1-red/20">
                    <StandingsTable standings={raceState?.standings} />
                  </CardContent>
                </Card>
              </Panel>
              <ResizeHandle direction="vertical" />
              <Panel defaultSize={35} minSize={20} className="flex flex-col pt-2">
                <div className="flex-1 min-h-0">
                  <Suspense fallback={<Skeleton className="h-full w-full" />}>
                    <LiveSystemFeed />
                  </Suspense>
                </div>
              </Panel>
              
              <ResizeHandle direction="vertical" />
              <Panel defaultSize={25} minSize={15} className="flex flex-col pt-2">
                <Suspense fallback={<Skeleton className="h-full w-full" />}>
                  <HealthConsole />
                </Suspense>
              </Panel>
            </Group>
          </Panel>

          <ResizeHandle direction="horizontal" />
          
          {/* Center Column: Core Analytics */}
          <Panel defaultSize={55} minSize={30} className="flex flex-col px-2">
            <Group orientation="vertical" className="h-full">
              <Panel defaultSize={60} minSize={30} className="flex flex-col pb-2">
                <Card className="flex flex-col overflow-hidden border-white/10 bg-white/5 h-full">
                  <CardHeader className="flex flex-row items-center justify-between gap-4 py-3 px-4 border-b border-white/5 bg-white/5">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-[10px] font-black uppercase tracking-widest text-f1-muted">Live Telemetry Trace</CardTitle>
                      <div className="relative overflow-hidden group">
                        <input
                          type="file"
                          onChange={handleUploadTelemetry}
                          className="absolute inset-0 opacity-0 cursor-pointer z-10"
                          accept=".csv,.json"
                        />
                        <button className="flex items-center gap-1.5 px-2 py-1 rounded border border-f1-border bg-f1-dark text-[9px] text-f1-muted font-bold uppercase group-hover:text-white transition">
                          <Upload className="w-3 h-3" />
                          {isUploading ? "..." : "Upload"}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1.5">
                        <span className="rounded-sm bg-f1-red/10 px-2 py-0.5 text-[9px] font-bold uppercase text-f1-red border border-f1-red/20">{localPayload.circuit}</span>
                        <span className="rounded-sm bg-white/5 px-2 py-0.5 text-[9px] font-bold uppercase text-f1-muted border border-white/10">{localPayload.driver}</span>
                      </div>
                      <div className="flex items-center gap-1 border-l border-white/10 pl-3">
                        <button onClick={() => handleExportTelemetry('csv')} className="p-1 text-f1-muted hover:text-white transition-colors" title="CSV"><Download className="w-3 h-3" /></button>
                        <button onClick={() => handleExportTelemetry('json')} className="text-[9px] font-bold text-f1-muted hover:text-white transition-colors px-1">JSON</button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-f1-red/20">
                    {localPayload.laps.length > 0 ? (
                      <Suspense fallback={<div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-f1-red" /></div>}>
                        <LapChart data={localPayload.laps} />
                      </Suspense>
                    ) : (
                      <div className="h-full flex items-center justify-center p-6 text-center">
                        <div>
                          <p className="text-xs font-bold text-f1-muted uppercase tracking-widest">Awaiting Data stream</p>
                          <p className="mt-1 text-[10px] text-f1-muted">Upload a telemetry file to initialize analysis.</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Panel>
              
              <ResizeHandle direction="vertical" className="my-1" />
              
              <Panel defaultSize={25} minSize={15} className="flex flex-col gap-4">
                <Card className="border-f1-red/20 bg-f1-red/5 relative overflow-hidden group h-full">
                  <div className="absolute top-0 right-0 p-2 opacity-5">
                    <Activity className="w-20 h-20 text-f1-red" />
                  </div>
                  <CardHeader className="py-2 px-4 border-b border-f1-red/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-3 h-3 text-f1-red" />
                      <CardTitle className="text-[10px] font-black uppercase tracking-widest">AI Strategy Engine</CardTitle>
                    </div>
                    {recoError && <span className="text-[9px] font-bold text-f1-red uppercase animate-pulse">{recoError}</span>}
                  </CardHeader>
                  <CardContent className="p-4 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center overflow-y-auto scrollbar-thin scrollbar-thumb-f1-red/20">
                    <div>
                      <p className="text-[11px] text-f1-secondary leading-tight">AI will process the telemetry snapshot to determine optimal pit windows.</p>
                      {reco && <p className="mt-2 text-xs font-bold text-white uppercase tracking-wide">Command: <span className="text-f1-red">{reco.action}</span></p>}
                    </div>
                    <Button 
                      onClick={onRecommend} 
                      disabled={recoLoading}
                      className="h-10 px-8 bg-f1-red text-white text-[10px] font-bold uppercase tracking-widest shadow-[0_12px_24px_rgba(225,6,0,0.2)] hover:bg-f1-red-dark active:scale-95 transition-all"
                    >
                      {recoLoading ? "Analyzing..." : "Generate AI Recommendation"}
                    </Button>
                  </CardContent>
                </Card>
              </Panel>
              
              <ResizeHandle direction="vertical" />
              
              <Panel defaultSize={15} minSize={10} className="flex flex-col pt-2">
                <Suspense fallback={<Skeleton className="h-full w-full" />}>
                  <FastF1Loader onDataLoaded={(data) => setLocalPayload(data)} />
                </Suspense>
              </Panel>

              <ResizeHandle direction="vertical" />
              <Panel defaultSize={15} minSize={10} className="flex flex-col pt-2">
                <Card className="border-white/10 bg-white/5 h-full overflow-hidden">
                  <CardHeader className="py-2 px-4 border-b border-white/5">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-f1-muted">Race Timeline</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 overflow-y-auto scrollbar-thin">
                    <EventTimeline />
                  </CardContent>
                </Card>
              </Panel>
            </Group>
          </Panel>

          <ResizeHandle direction="horizontal" />

          {/* Right Column: Reasoning & Communication */}
          <Panel defaultSize={25} minSize={20} className="flex flex-col pl-2">
            <Group orientation="vertical" className="h-full">
              <Panel defaultSize={40} minSize={20} className="flex flex-col pb-2">
                <Card className="flex flex-col overflow-hidden border-white/10 bg-white/5 h-full">
                  <CardHeader className="py-2 px-4 border-b border-white/5 bg-white/5">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-f1-muted">Reasoning Trace</CardTitle>
                  </CardHeader>
                  <CardContent className="min-h-0 flex-1 p-0 overflow-y-auto scrollbar-thin scrollbar-thumb-f1-red/20">
                    <StrategyTimeline reco={reco} />
                  </CardContent>
                </Card>
              </Panel>

              <ResizeHandle direction="vertical" />

              <Panel defaultSize={20} minSize={15} className="py-2 overflow-y-auto scrollbar-thin scrollbar-thumb-f1-red/20">
                <ConfidenceDecompositionCard 
                  decomposition={reco?.confidence_decomposition} 
                  overallConfidence={reco?.confidence ?? 0}
                />
              </Panel>

              <ResizeHandle direction="vertical" />

              <Panel defaultSize={42} minSize={25} className="flex flex-col pt-2">
                <Card className="flex flex-col overflow-hidden border-white/10 bg-white/5 h-full">
                  <CardHeader className="py-3 px-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-f1-muted">Copilot Assistant</CardTitle>
                    <span className="text-[8px] font-bold text-f1-red uppercase tracking-[0.2em] px-2 py-0.5 bg-f1-red/10 border border-f1-red/20">Active</span>
                  </CardHeader>
                  <CardContent className="flex min-h-0 flex-1 flex-col p-0 overflow-hidden">
                    <div className="border-b border-white/5 px-4 pb-2 pt-3">
                      <div className="flex flex-wrap gap-1.5">
                        {promptChips.map((chip) => (
                          <button
                            key={chip}
                            onClick={() => setDraft(chip)}
                            className="rounded-sm border border-white/10 bg-white/5 px-2 py-1 text-[9px] text-f1-muted uppercase font-bold hover:bg-f1-red/10 hover:text-white transition-colors"
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 scrollbar-thin scrollbar-thumb-f1-red/20">
                      {chat.map((m, idx) => (
                        <div key={idx} className={`max-w-[90%] rounded-lg border p-3 text-xs leading-relaxed ${m.role === "user" ? "ml-auto border-white/5 bg-white/5" : "border-f1-red/10 bg-f1-red/5"}`}>
                          <p className="mb-1 text-[8px] font-black uppercase tracking-widest text-f1-muted">{m.role === "user" ? "User" : "PitMind AI"}</p>
                          <p className="text-f1-secondary">{m.content}{m.streaming && <span className="ml-1 animate-pulse text-f1-red">▍</span>}</p>
                        </div>
                      ))}
                    </div>

                    <div className="p-3 border-t border-white/5 bg-f1-dark/20">
                      <div className="flex gap-2 bg-black/20 p-1 rounded border border-white/5">
                        <input
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && onSendChat()}
                          placeholder="Ask Strategy..."
                          className="flex-1 bg-transparent px-3 py-1.5 text-xs text-white placeholder:text-f1-muted outline-none"
                          disabled={isChatThinking}
                        />
                        <Button onClick={onSendChat} disabled={isChatThinking} size="sm" className="bg-f1-red/80 hover:bg-f1-red text-[10px] h-8 font-bold px-4">Send</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Panel>

              <ResizeHandle direction="vertical" />
              <Panel defaultSize={15} minSize={10} className="flex flex-col pt-2">
                <Suspense fallback={<Skeleton className="h-full w-full" />}>
                  <DecisionLog onExportSession={() => handleExportDecisions('csv')} />
                </Suspense>
              </Panel>
            </Group>
          </Panel>
        </Group>
      </div>

      {/* Role-based Context (Floating/Overlaid if needed, but here simple) */}
      {currentRole !== 'engineer' && (
        <div className="absolute bottom-6 right-6 z-50 max-w-md animate-in fade-in slide-in-from-bottom-4">
          <Card className="border-f1-red/20 bg-f1-black/90 backdrop-blur shadow-2xl">
            <CardHeader className="py-2 px-4 border-b border-f1-red/10">
              <CardTitle className="text-[10px] font-black uppercase text-f1-red">{currentRole} Context</CardTitle>
            </CardHeader>
            <CardContent className="p-4 text-[11px] text-f1-secondary leading-relaxed">
              {currentRole === 'strategist' ? "Focus on long-term race planning, compound selection, and scenario analysis." : "Focus on race narrative, position battles, and fan engagement."}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
