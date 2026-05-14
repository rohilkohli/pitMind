import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useFirebaseRaceState } from "../hooks/useFirebaseRaceState";
import { useDashboardState } from "../hooks/useDashboardState";
import { useRole } from "../contexts/RoleContext";
import { KpiStrip } from "../components/dashboard/KpiStrip";
import { StandingsTable } from "../components/dashboard/StandingsTable";
import { StrategyTimeline } from "../components/dashboard/StrategyTimeline";
import type { StrategyPanelCommitPayload } from "../components/dashboard/StrategyTimeline";
import { EventTimeline } from "../components/dashboard/EventTimeline";
import { ConfidenceDecompositionCard } from "../components/dashboard/ConfidenceDecompositionCard";
import { ShareButton } from "../components/dashboard/ShareButton";
import { RoleSwitcher } from "../components/dashboard/RoleSwitcher";
import { StreamHealthMonitor } from "../components/dashboard/StreamHealthMonitor";
import { useTelemetry } from "../hooks/useTelemetry";
import { demoDriverA } from "../data/demoTelemetry";
import { postRecommend, postChat, postCommitStrategy, uploadTelemetry, type StrategyRecommendation, type TelemetryPayload } from "../services/api";
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

  function handleInjectBriefToChat(brief: string) {
    setDraft(brief);
  }

  async function handleCommitStrategy(payload: StrategyPanelCommitPayload) {
    if (!reco) {
      throw new Error("No recommendation available to commit");
    }

    const token = await auth?.currentUser?.getIdToken(true);
    return postCommitStrategy(
      {
        recommendation: reco,
        checklist: {
          pit_crew_ready: payload.checklist.pitCrewReady,
          tyre_set_confirmed: payload.checklist.tyreSetConfirmed,
          radio_call_prepared: payload.checklist.radioCallPrepared,
        },
        execution_brief: payload.executionBrief,
        session_context: {
          circuit: localPayload.circuit,
          session_label: localPayload.session_label,
          driver: localPayload.driver,
          lap_count: localPayload.laps.length,
          current_lap: raceState?.current_lap,
          session_status: raceState?.session_status,
        },
      },
      token,
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-f1-black text-f1-white overflow-x-hidden pb-32">
      {/* Dynamic Header Banner */}
      <div className="border-b border-f1-red/30 bg-f1-black/90 px-6 py-4 backdrop-blur-md sticky top-0 z-[100]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-f1-red">PitMind Mission Control</span>
              <h1 className="text-xl font-black uppercase tracking-tighter text-white">Strategy Console <span className="ml-3 text-f1-muted text-xs">v1.2.5</span></h1>
            </div>
            <div className="h-10 w-px bg-white/10 mx-2" />
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 px-4 py-1.5 rounded-sm bg-f1-red/10 border border-f1-red/20 shadow-[0_0_20px_rgba(225,6,0,0.1)]">
                <div className="h-2.5 w-2.5 rounded-full bg-f1-red animate-pulse" />
                <span className="text-[11px] font-black text-white uppercase tracking-widest">Live Sync Active</span>
              </div>
              <RoleSwitcher currentRole={currentRole} onRoleChange={setRole} />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden xl:flex items-center gap-8 border-r border-white/10 pr-8">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-f1-muted uppercase tracking-wider">Circuit</span>
                <span className="text-sm font-black text-white uppercase">{localPayload.circuit}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-f1-muted uppercase tracking-wider">Session Status</span>
                <span className="text-sm font-black text-f1-red uppercase">{raceState?.session_status ?? "RACE_LIVE"}</span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-6">
              <StreamHealthMonitor showMetrics={false} />
              <ShareButton onCopyUrl={copyShareableUrl} getShareUrl={getShareableUrl} />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1920px] p-6 h-[calc(100vh-120px)]">
        <Group orientation="horizontal" className="h-full gap-6">
          {/* Left Column: Standings & System Logs */}
          <Panel defaultSize={25} minSize={20} className="h-full">
            <div className="space-y-6 h-full overflow-y-auto pr-2 scrollbar-thin">
              <Card className="border-[#38383F] bg-[#1F1F27] overflow-hidden shadow-2xl">
                <CardHeader className="py-4 px-5 border-b border-[#38383F] bg-[#1F1F27]">
                  <CardTitle className="f1-section-title">
                    <Activity className="w-3.5 h-3.5 text-f1-red" />
                    Live Standings
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <StandingsTable standings={raceState?.standings} />
                </CardContent>
              </Card>

              <Card className="border-[#38383F] bg-[#1F1F27] overflow-hidden h-[450px] flex flex-col shadow-2xl">
                <Suspense fallback={<Skeleton className="h-full w-full" />}>
                  <LiveSystemFeed />
                </Suspense>
              </Card>
              
              <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                <HealthConsole />
              </Suspense>
            </div>
          </Panel>

          <ResizeHandle />

          {/* Center Column: Telemetry & Core Logic */}
          <Panel defaultSize={50} minSize={30} className="h-full">
            <div className="space-y-6 h-full overflow-y-auto px-2 scrollbar-thin">
              <Card className="overflow-hidden border-[#38383F] bg-[#1F1F27] min-h-[600px] flex flex-col shadow-2xl">
                <CardHeader className="flex flex-row items-center justify-between gap-6 py-4 px-5 border-b border-[#38383F] bg-[#1F1F27]">
                  <div className="flex items-center gap-4">
                    <CardTitle className="f1-section-title">Telemetry Analysis</CardTitle>
                    <div className="relative overflow-hidden group">
                      <input
                        type="file"
                        onChange={handleUploadTelemetry}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        accept=".csv,.json"
                      />
                      <button className="flex items-center gap-2 px-3 py-1.5 rounded-none border border-f1-red/30 bg-f1-red/5 text-[10px] text-f1-red font-black uppercase group-hover:bg-f1-red group-hover:text-white transition-all duration-300">
                        <Upload className="w-3.5 h-3.5" />
                        Ingest Data
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex gap-2">
                      <span className="bg-f1-red/10 px-3 py-1 text-[10px] font-black uppercase text-f1-red border border-f1-red/20">{localPayload.driver}</span>
                      <span className="bg-white/5 px-3 py-1 text-[10px] font-black uppercase text-[#67676D] border border-[#38383F]">Laps: {localPayload.laps.length}</span>
                    </div>
                    <div className="flex items-center gap-2 border-l border-[#38383F] pl-4">
                      <button onClick={() => handleExportTelemetry('csv')} className="p-2 text-[#67676D] hover:text-white transition-colors" title="Export CSV"><Download className="w-4 h-4" /></button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 flex-1 min-h-[450px]">
                  <Suspense fallback={<div className="h-[450px] flex items-center justify-center bg-f1-black/20"><Loader2 className="animate-spin text-f1-red w-8 h-8" /></div>}>
                    <LapChart data={localPayload.laps} />
                  </Suspense>
                </CardContent>
              </Card>
              
              <Card className={`relative overflow-hidden group shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-500 border-[#38383F] bg-[#1F1F27] ${recoLoading ? 'ring-2 ring-f1-red animate-pulse' : ''}`}>
                {/* Animated Background Glow */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(225,6,0,0.05),transparent_70%)] animate-subtle-glow pointer-events-none" />
                
                <CardHeader className="py-4 px-6 border-b border-[#38383F] flex items-center justify-between bg-[#1F1F27]">
                  <div className="flex items-center gap-3">
                    <Zap className={`w-4 h-4 text-f1-red ${recoLoading ? 'animate-bounce' : ''}`} />
                    <CardTitle className="text-[12px] font-black uppercase tracking-[0.2em] text-white">AI Strategy Oracle</CardTitle>
                  </div>
                  {recoError && <span className="text-[10px] font-black text-f1-red uppercase animate-pulse tracking-wider bg-f1-red/10 px-3 py-1 rounded">{recoError}</span>}
                </CardHeader>
                <CardContent className="p-8 space-y-6 relative z-10">
                  <div>
                    <p className="text-[13px] text-[#C4C4C4] leading-relaxed font-medium italic">Predictive model analyzing tyre degradation, fuel delta, and safety car probability based on live telemetry snapshots.</p>
                    {reco && (
                      <div className="mt-6 p-5 bg-f1-red/10 border border-f1-red/20 rounded-none shadow-inner">
                        <p className="text-[10px] font-black text-[#67676D] uppercase tracking-[0.3em] mb-2">Generated Directive</p>
                        <p className="text-3xl font-black text-white uppercase tracking-tighter leading-none italic">{reco.action}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <Button 
                      onClick={onRecommend} 
                      disabled={recoLoading}
                      className="w-full h-14 bg-f1-red text-white text-[12px] font-black uppercase tracking-[0.3em] shadow-[0_15px_30px_rgba(225,6,0,0.4)] hover:bg-f1-red-dark active:scale-[0.98] transition-all duration-300 rounded-none border-b-4 border-f1-red-dark"
                    >
                      {recoLoading ? "Processing Inference..." : "Execute Command"}
                    </Button>
                    <div className="text-center">
                      <span className="text-[11px] font-bold text-[#67676D] uppercase tracking-widest">
                        AI READY — GRANITE v1.3 — IBM WATSONX
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
                  <FastF1Loader onDataLoaded={(data) => setLocalPayload(data)} />
                </Suspense>

                <Card className="border-[#38383F] bg-[#1F1F27] overflow-hidden flex flex-col shadow-2xl">
                  <CardHeader className="py-3 px-5 border-b border-[#38383F] bg-[#1F1F27]">
                    <CardTitle className="f1-section-title">Live Race Timeline</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 flex-1 overflow-y-auto min-h-[350px] scrollbar-thin">
                    <EventTimeline />
                  </CardContent>
                </Card>
              </div>
            </div>
          </Panel>

          <ResizeHandle />

          {/* Right Column: AI Reasoning & Support */}
          <Panel defaultSize={25} minSize={20} className="h-full">
            <div className="space-y-6 h-full overflow-y-auto pl-2 scrollbar-thin">
              <Card className="border-[#38383F] bg-[#1F1F27] overflow-hidden flex flex-col min-h-[400px] shadow-2xl">
                <CardHeader className="py-3 px-5 border-b border-[#38383F] bg-[#1F1F27]">
                  <CardTitle className="f1-section-title">Reasoning Trace</CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-y-auto max-h-[500px] scrollbar-thin">
                  <StrategyTimeline
                    reco={reco}
                    strategyChecklistKey={`pitmind.strategy.checklist.${localPayload.circuit}.${localPayload.session_label}.${localPayload.driver}`}
                    onInjectBriefToChat={handleInjectBriefToChat}
                    onCommitStrategy={handleCommitStrategy}
                  />
                </CardContent>
              </Card>

              <ConfidenceDecompositionCard 
                decomposition={reco?.confidence_decomposition} 
                overallConfidence={reco?.confidence ?? 0}
              />

              <Card className="border-[#38383F] bg-[#1F1F27] overflow-hidden flex flex-col min-h-[550px] shadow-2xl">
                <CardHeader className="py-4 px-5 border-b border-[#38383F] bg-[#1F1F27] flex items-center justify-between">
                  <CardTitle className="text-[11px] font-black uppercase tracking-widest text-[#67676D]">PitMind Assistant</CardTitle>
                  <div className="flex items-center gap-2 px-3 py-1 bg-[#2D2D35] border border-[#38383F]">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#39B54A] animate-pulse-dot" />
                    <span className="text-[9px] font-black text-[#39B54A] uppercase tracking-[0.2em]">Online</span>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col p-0">
                  <div className="border-b border-[#38383F] px-5 py-4 bg-[#15151E]/40">
                    <div className="flex flex-wrap gap-2">
                      {promptChips.map((chip) => (
                        <button
                          key={chip}
                          onClick={() => setDraft(chip)}
                          className="f1-chip"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 space-y-4 overflow-y-auto px-5 py-6 max-h-[400px] scrollbar-thin">
                    {chat.map((m, idx) => (
                      <div key={idx} className={`max-w-[90%] rounded-none border p-4 text-[13px] leading-relaxed shadow-lg ${m.role === "user" ? "ml-auto border-[#38383F] bg-[#2D2D35] text-white" : "border-f1-red/20 bg-f1-red/5 text-white"}`}>
                        <p className="mb-2 text-[9px] font-black uppercase tracking-[0.2em] text-[#67676D]">{m.role === "user" ? "Primary Engineer" : "System Oracle"}</p>
                        <p className="font-medium tracking-tight">{m.content}{m.streaming && <span className="ml-1 animate-pulse text-f1-red">▍</span>}</p>
                      </div>
                    ))}
                  </div>

                  <div className="p-5 border-t border-[#38383F] bg-[#1F1F27]">
                    <div className="flex gap-0 bg-[#2D2D35] border border-[#38383F] focus-within:border-f1-red transition-colors">
                      <input
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && onSendChat()}
                        placeholder="ENTER STRATEGY QUERY..."
                        className="flex-1 bg-transparent px-4 py-3.5 text-[13px] text-white placeholder:text-[#67676D] outline-none font-medium uppercase tracking-tight"
                        disabled={isChatThinking}
                      />
                      <button 
                        onClick={onSendChat} 
                        disabled={isChatThinking} 
                        className="bg-f1-red hover:bg-f1-red-dark text-white w-12 flex items-center justify-center transition-all active:scale-95"
                      >
                        <Activity className="w-5 h-5 rotate-90" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Suspense fallback={<Skeleton className="h-80 w-full" />}>
                <DecisionLog onExportSession={() => handleExportDecisions('csv')} />
              </Suspense>
            </div>
          </Panel>
        </Group>
      </div>

      {/* Persistent Role Identity */}
      {currentRole !== 'engineer' && (
        <div className="fixed bottom-8 left-8 z-[200] max-w-sm animate-in fade-in slide-in-from-bottom-8 duration-500">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-f1-red to-f1-red-dark rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <Card className="relative border-f1-red/30 bg-f1-black/95 backdrop-blur-xl shadow-3xl">
              <CardHeader className="py-3 px-5 border-b border-f1-red/20 flex items-center justify-between">
                <CardTitle className="text-[11px] font-black uppercase text-f1-red tracking-[0.2em]">{currentRole} Context</CardTitle>
                <div className="h-1.5 w-1.5 rounded-full bg-f1-red animate-ping" />
              </CardHeader>
              <CardContent className="p-5 text-[12px] text-f1-secondary leading-relaxed font-bold italic">
                {currentRole === 'strategist' ? "Strategic Overwatch: Prioritize lap delta and tyre degradation cycles." : "Broadcast Feed: Focus on narrative arc and head-to-head performance battles."}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
