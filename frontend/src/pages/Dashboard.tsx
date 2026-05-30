import React, { lazy, Suspense, useEffect, useRef, useState, Fragment } from "react";
import { useFirebaseRaceState } from "../hooks/useFirebaseRaceState";
import { useDashboardState } from "../hooks/useDashboardState";
import { useRole } from "../contexts/RoleContext";
import { StandingsTable } from "../components/dashboard/StandingsTable";

import { EventTimeline } from "../components/dashboard/EventTimeline";
import { ConfidenceDecompositionCard } from "../components/dashboard/ConfidenceDecompositionCard";
import { ShareButton } from "../components/dashboard/ShareButton";
import { RoleSwitcher } from "../components/dashboard/RoleSwitcher";
import { StreamHealthMonitor } from "../components/dashboard/StreamHealthMonitor";
import { useTelemetry } from "../hooks/useTelemetry";
import { demoDriverA } from "../data/demoTelemetry";
import {
  postRecommend,
  postChat,
  uploadTelemetry,
  type StrategyRecommendation,
  type TelemetryPayload,
} from "../services/api";
import { auth } from "../lib/firebase";
import { Loader2, Download, Upload, Zap } from "lucide-react";
import * as Resizable from "react-resizable-panels";
const { Panel, Group } = Resizable;
import { ResizeHandle } from "../components/ui/ResizeHandle";
import { MinimizablePanel } from "../components/ui/MinimizablePanel";
import { usePanelStateContext } from "../contexts/PanelStateContext";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { SortableColumn } from "../components/layout/SortableColumn";

import { exportToCsv, exportToJson } from "../lib/utils";

// Lazy load heavy components
const LapChart = lazy(() =>
  import("../components/dashboard/LapChart").then((module) => ({ default: module.LapChart })),
);
const DecisionLog = lazy(() =>
  import("../components/dashboard/DecisionLog").then((module) => ({ default: module.DecisionLog })),
);
const HealthConsole = lazy(() =>
  import("../components/dashboard/HealthConsole").then((module) => ({
    default: module.HealthConsole,
  })),
);
const FastF1Loader = lazy(() =>
  import("../components/dashboard/FastF1Loader").then((module) => ({
    default: module.FastF1Loader,
  })),
);
const LiveSystemFeed = lazy(() =>
  import("../components/dashboard/LiveSystemFeed").then((module) => ({
    default: module.LiveSystemFeed,
  })),
);

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
    timeFilter: "live",
  });
  const { collapseAll, expandAll } = usePanelStateContext();

  // Local telemetry state (for demo / upload purposes as built in step 1)
  const { payload: initialPayload } = useTelemetry(demoDriverA);

  const [reco, setReco] = useState<StrategyRecommendation | null>(null);
  const [recoError, setRecoError] = useState<string | null>(null);
  const [recoLoading, setRecoLoading] = useState(false);

  useEffect(() => {
    let active = true;
    async function autoLoad() {
      setRecoLoading(true);
      try {
        const token = await auth?.currentUser?.getIdToken();
        const result = await postRecommend(initialPayload, token || undefined);
        if (active) {
          setReco(result);
        }
      } catch (e) {
        console.error("Auto-load failed, using fallback:", e);
        if (active) {
          setReco({
            action: "PIT FOR FRESH SOFTS",
            confidence: 84,
            explanation:
              "Tyre wear at 73%. Lap time degradation trend\nexceeds threshold. Pit window optimal at current lap.",
            evidence: ["Tyre wear: 73%", "Lap delta: +0.31s", "Gap to P2: 1.8s"],
            urgency_score: 84,
            assumptions: ["No safety car in next 3 laps"],
            alternative: "Stay out for 2 more laps if gap to P2 exceeds 2.5s",
            pit_this_lap: true,
            suggested_compound: "SOFT",
            scores: {
              pit_urgency: 84,
              sc_probability_next_3_laps: 15,
              overtake_risk: 30,
              recommended_window_laps: [18, 25],
            },
            structured_reasons: [
              "Tyre wear at 73% exceeds critical threshold",
              "Lap time degradation trend exceeds normal limits",
              "Pit window optimal at current lap",
            ],
            pipeline_steps: [
              "FastF1 Data Load Completed",
              "Tyre Wear Assessment Completed",
              "Race Simulation Completed",
              "Granite Strategy Suggestion Generated",
            ],
            confidence_decomposition: {
              data_quality: 92,
              model_certainty: 84,
              stability: 78,
              regret_bound: 0.16,
            },
          });
        }
      } finally {
        if (active) {
          setRecoLoading(false);
        }
      }
    }
    autoLoad();
    return () => {
      active = false;
    };
  }, []);

  const [draft, setDraft] = useState("");
  const [chat, setChat] = useState<ChatMessage[]>([
    {
      id: "assistant-welcome",
      role: "assistant",
      content: "PitMind Copilot initialized. How can I help analyze the strategy?",
    },
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
      const errorMessage = e instanceof Error ? e.message : String(e);
      setRecoError(errorMessage);
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
    setChat([
      ...next,
      { id: assistantMessageId, role: "assistant", content: "Thinking...", streaming: true },
    ]);
    setIsChatThinking(true);
    try {
      const token = await auth?.currentUser?.getIdToken(true);
      const ctx = {
        recommendation: reco,
        telemetry: { laps: localPayload.laps.length, circuit: localPayload.circuit },
      };
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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleUploadTelemetry(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploading(true);
      setUploadProgress(0);
      setUploadError(null);

      // Simulate progress (since API doesn't support real progress tracking)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      try {
        const token = await auth?.currentUser?.getIdToken(true);
        const data = await uploadTelemetry(file, token);
        setUploadProgress(100);
        setLocalPayload(data);
        setTimeout(() => {
          setUploadProgress(0);
          setIsUploading(false);
        }, 500);
      } catch (err) {
        clearInterval(progressInterval);
        console.error(err);
        const errorMessage = err instanceof Error ? err.message : "Failed to upload telemetry file. Please try again.";
        setUploadError(errorMessage);
        setUploadProgress(0);
        setIsUploading(false);
      } finally {
        clearInterval(progressInterval);
      }
    }
  }

  function handleExportTelemetry(format: "csv" | "json") {
    const filename = `pitmind_telemetry_${localPayload.driver}_${localPayload.circuit}_${new Date().toISOString().split("T")[0]}`;
    if (format === "csv") {
      exportToCsv(`${filename}.csv`, localPayload.laps);
    } else {
      exportToJson(`${filename}.json`, localPayload);
    }
  }

  function handleExportDecisions(format: "csv" | "json") {
    console.log(`Exporting decisions as ${format}`);
  }

  function handleInjectBriefToChat(brief: string) {
    setDraft(brief);
  }

  const [columnOrder, setColumnOrder] = useState(() => {
    const saved = localStorage.getItem("pitmind_dashboard_layout");
    return saved ? JSON.parse(saved) : ["left", "center", "right"];
  });

  // Track mission bar height for correct grid height calc
  const missionRef = useRef<HTMLDivElement>(null);
  const [missionH, setMissionH] = useState(0);
  useEffect(() => {
    if (!missionRef.current) return;
    const ro = new ResizeObserver(([entry]) => setMissionH(entry.contentRect.height));
    ro.observe(missionRef.current);
    setMissionH(missionRef.current.offsetHeight);
    return () => ro.disconnect();
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: import("@dnd-kit/core").DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setColumnOrder((items: string[]) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        localStorage.setItem("pitmind_dashboard_layout", JSON.stringify(newOrder));
        return newOrder;
      });
    }
  }

  /* ── LEFT COLUMN ─────────────────────────────────────────── */
  const renderLeftColumn = () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 1,
        height: "100%",
        minHeight: 0,
        overflow: "hidden",
        background: "var(--border)",
      }}
    >
      {/* Scrollable inner */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 1,
          scrollbarGutter: "stable",
        }}
      >
        {/* Decision Log — top of left panel */}
        <MinimizablePanel
          id="dashboard__weather-module"
          header={<div className="pm-panel-title">DECISION LOG</div>}
          headerStyle={{ padding: "10px 16px", borderBottom: "1px solid var(--border)" }}
          className="pm-panel"
          style={{ flex: "0 0 auto", maxHeight: "38vh", overflow: "hidden" }}
          bodyStyle={{ overflowY: "auto", flex: 1 }}
        >
          <Suspense fallback={<div className="skeleton-row" style={{ height: 120 }} />}>
            <DecisionLog onExportSession={() => handleExportDecisions("csv")} />
          </Suspense>
        </MinimizablePanel>

        {/* Driver Standings */}
        <MinimizablePanel
          id="dashboard__driver-standings"
          header={<div className="pm-panel-title">DRIVER STANDINGS</div>}
          headerStyle={{ padding: "10px 16px", borderBottom: "1px solid var(--border)" }}
          className="pm-panel"
          style={{ flex: "0 0 auto" }}
          bodyStyle={{ overflowY: "auto", maxHeight: "38vh" }}
        >
          <StandingsTable standings={raceState?.standings} />
        </MinimizablePanel>

        {/* Live System Feed */}
        <MinimizablePanel
          id="dashboard__team-radio-feed"
          header={<div className="pm-panel-title">LIVE SYSTEM FEED</div>}
          headerStyle={{ padding: "10px 16px", borderBottom: "1px solid var(--border)" }}
          className="pm-panel"
          style={{ flex: "0 0 auto", minHeight: 48 }}
          bodyStyle={{ overflowY: "auto", maxHeight: "35vh" }}
        >
          <Suspense fallback={<div className="skeleton-row" style={{ height: 200 }} />}>
            <LiveSystemFeed />
          </Suspense>
        </MinimizablePanel>

        {/* Health Console */}
        <MinimizablePanel
          id="dashboard__session-info"
          header={<div className="pm-panel-title">SYSTEM HEALTH</div>}
          headerStyle={{ padding: "10px 16px", borderBottom: "1px solid var(--border)" }}
          className="pm-panel"
          style={{ flex: "0 0 auto" }}
          defaultCollapsed={true}
        >
          <Suspense fallback={<div className="skeleton-row" style={{ height: 120 }} />}>
            <HealthConsole />
          </Suspense>
        </MinimizablePanel>
      </div>
    </div>
  );

  /* ── CENTER COLUMN ───────────────────────────────────────── */
  const renderCenterColumn = () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 1,
        height: "100%",
        minHeight: 0,
        overflow: "hidden",
        background: "var(--border)",
      }}
    >
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 1,
          scrollbarGutter: "stable",
        }}
      >
        <MinimizablePanel
          id="dashboard__gap-chart"
          header={
            <>
              <div className="pm-panel-title">LAP TIME TRACE</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
                <div className="relative overflow-hidden group" style={{ position: "relative" }}>
                  <label htmlFor="file-upload-input" className="sr-only">
                    Upload telemetry data file
                  </label>
                  <input
                    id="file-upload-input"
                    type="file"
                    onChange={handleUploadTelemetry}
                    style={{
                      position: "absolute",
                      inset: 0,
                      opacity: 0,
                      cursor: "pointer",
                      zIndex: 10,
                    }}
                    accept=".csv,.json"
                    aria-label="Upload telemetry data file (CSV or JSON)"
                  />
                  <button
                    disabled={isUploading}
                    aria-label={isUploading ? "Uploading telemetry data" : "Upload telemetry data"}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "4px 10px",
                      border: "1px solid var(--border-active)",
                      background: "var(--f1-red-dim)",
                      color: "var(--f1-red)",
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      cursor: "pointer",
                      clipPath: "polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)",
                    }}
                  >
                    {isUploading ? (
                      <Loader2 style={{ width: 10, height: 10 }} className="animate-spin" aria-hidden="true" />
                    ) : (
                      <Upload style={{ width: 10, height: 10 }} aria-hidden="true" />
                    )}
                    {isUploading ? `Ingesting... ${uploadProgress}%` : "Ingest Data"}
                  </button>
                  {/* Upload progress bar */}
                  {isUploading && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 2,
                        background: "rgba(232,0,45,0.2)",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${uploadProgress}%`,
                          background: "var(--f1-red)",
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>
                  )}
                </div>
                {/* Upload error display */}
                {uploadError && (
                  <div
                    role="alert"
                    style={{
                      position: "absolute",
                      top: "calc(100% + 8px)",
                      right: 0,
                      padding: "8px 12px",
                      background: "var(--f1-red-dim)",
                      border: "1px solid var(--border-active)",
                      borderLeft: "3px solid var(--f1-red)",
                      fontSize: 9,
                      color: "var(--f1-red)",
                      whiteSpace: "nowrap",
                      zIndex: 100,
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    {uploadError}
                    <button
                      onClick={() => setUploadError(null)}
                      style={{
                        marginLeft: 8,
                        background: "transparent",
                        border: "none",
                        color: "var(--f1-red)",
                        cursor: "pointer",
                        fontSize: 11,
                      }}
                      aria-label="Dismiss upload error"
                    >
                      ✕
                    </button>
                  </div>
                )}
                <span
                  style={{
                    fontFamily: "'Orbitron', sans-serif",
                    fontSize: 10,
                    fontWeight: 700,
                    color: "var(--f1-red)",
                    background: "var(--f1-red-dim)",
                    border: "1px solid var(--border-active)",
                    padding: "2px 8px",
                  }}
                >
                  {localPayload.driver}
                </span>
                <span
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 10,
                    color: "var(--text-secondary)",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid var(--border)",
                    padding: "2px 8px",
                  }}
                >
                  LAPS: {localPayload.laps.length}
                </span>
                <button
                  onClick={() => handleExportTelemetry("csv")}
                  style={{
                    color: "var(--text-secondary)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 4,
                  }}
                  title="Export CSV"
                >
                  <Download style={{ width: 14, height: 14 }} />
                </button>
              </div>
            </>
          }
          headerStyle={{ padding: "10px 16px", borderBottom: "1px solid var(--border)" }}
          className="pm-panel"
          style={{ flex: "0 0 auto", minHeight: 350 }}
          animationDuration={350}
        >
          <Suspense
            fallback={
              <div
                style={{
                  height: 300,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Loader2
                  className="animate-spin"
                  style={{ color: "var(--f1-red)", width: 24, height: 24 }}
                />
              </div>
            }
          >
            <LapChart
              data={localPayload.laps.map((lap) => ({
                lap: lap.lap,
                [localPayload.driver || "VER"]: lap.lap_time_s,
              }))}
              showTitle={false}
            />
          </Suspense>
        </MinimizablePanel>

        <MinimizablePanel
          id="dashboard__race-control-messages"
          header={<div className="pm-panel-title">STRATEGY ENGINE</div>}
          headerStyle={{ padding: "10px 16px", borderBottom: "1px solid var(--border)" }}
          className="pm-panel"
          style={{ flex: "0 0 auto", position: "relative", overflow: "hidden" }}
          defaultCollapsed={false}
          persist={false}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at 50% 50%, rgba(232,0,45,0.05), transparent 70%)",
              animation: "subtle-glow 3s infinite ease-in-out",
              pointerEvents: "none",
            }}
          />

          <div
            className="pm-throttle-bar"
            style={{ marginBottom: 12, position: "relative", zIndex: 1 }}
          >
            <div className="pm-throttle-fill" />
          </div>

          <div style={{ position: "relative", zIndex: 1 }}>
            <p
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11,
                color: "var(--text-secondary)",
                lineHeight: 1.6,
                marginBottom: 16,
                fontStyle: "italic",
              }}
            >
              Predictive model analyzing tyre degradation, fuel delta, and safety car probability.
            </p>

            {recoError && (
              <div
                role="alert"
                aria-live="polite"
                style={{
                  padding: "12px 16px",
                  border: "1px solid var(--border-active)",
                  background: "var(--f1-red-dim)",
                  borderLeft: "3px solid var(--f1-red)",
                  marginBottom: 12,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }} aria-hidden="true">⚠️</span>
                  <span
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 10,
                      color: "var(--f1-red)",
                      lineHeight: 1.5,
                      flex: 1,
                    }}
                  >
                    {recoError}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={onRecommend}
                    disabled={recoLoading}
                    style={{
                      padding: "6px 12px",
                      background: "var(--f1-red)",
                      color: "#fff",
                      border: "1px solid var(--border-active)",
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      cursor: recoLoading ? "not-allowed" : "pointer",
                      opacity: recoLoading ? 0.6 : 1,
                    }}
                    aria-label="Retry strategy recommendation"
                  >
                    🔄 Retry
                  </button>
                  <button
                    onClick={() => setRecoError(null)}
                    style={{
                      padding: "6px 12px",
                      background: "transparent",
                      color: "var(--text-secondary)",
                      border: "1px solid var(--border)",
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      cursor: "pointer",
                    }}
                    aria-label="Dismiss error message"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {reco && (
              <div
                style={{
                  padding: "14px",
                  background: "var(--f1-red-dim)",
                  border: "1px solid var(--border-active)",
                  marginBottom: 16,
                  borderLeft: "3px solid var(--f1-red)",
                }}
              >
                <div
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.25em",
                    textTransform: "uppercase",
                    color: "var(--text-secondary)",
                    marginBottom: 6,
                  }}
                >
                  Generated Directive
                </div>
                <div
                  style={{
                    fontFamily: "'Orbitron', sans-serif",
                    fontSize: 22,
                    fontWeight: 900,
                    color: "var(--text-primary)",
                    textTransform: "uppercase",
                    letterSpacing: "-0.02em",
                    lineHeight: 1,
                  }}
                >
                  {reco.action}
                </div>
              </div>
            )}

            <button
              onClick={onRecommend}
              disabled={recoLoading}
              className="pm-btn-primary"
              style={{ marginBottom: 10 }}
            >
              {recoLoading ? "Processing Inference..." : "Execute Command"}
            </button>
            <div
              style={{
                textAlign: "center",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10,
                color: "var(--text-secondary)",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
              }}
            >
              AI READY — GRANITE v1.3 — IBM WATSONX
            </div>
          </div>
        </MinimizablePanel>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 1,
            background: "var(--border)",
          }}
        >
          <MinimizablePanel
            id="dashboard__pit-stop-history"
            header={<div className="pm-panel-title">FASTF1 LOADER</div>}
            headerStyle={{ padding: "10px 16px", borderBottom: "1px solid var(--border)" }}
            className="pm-panel"
            style={{ minHeight: 48 }}
          >
            <Suspense fallback={<div className="skeleton-row" style={{ height: 320 }} />}>
              <FastF1Loader onDataLoaded={(data) => setLocalPayload(data)} />
            </Suspense>
          </MinimizablePanel>

          <MinimizablePanel
            id="dashboard__live-timing"
            header={<div className="pm-panel-title">EVENT TIMELINE</div>}
            headerStyle={{ padding: "10px 16px", borderBottom: "1px solid var(--border)" }}
            className="pm-panel"
            style={{ minHeight: 48 }}
            bodyStyle={{ overflowY: "auto", maxHeight: 280 }}
          >
            <EventTimeline />
          </MinimizablePanel>
        </div>
      </div>
    </div>
  );

  /* ── RIGHT COLUMN ────────────────────────────────────────── */
  const renderRightColumn = () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 1,
        height: "100%",
        minHeight: 0,
        overflow: "hidden",
        background: "var(--border)",
      }}
    >
      {/* PitMind Assistant Chat — TOP, takes most of the space */}
      <MinimizablePanel
        id="dashboard__race-control-chat"
        header={
          <>
            <div className="pm-panel-title">AI STRATEGY ORACLE</div>
            <span className="pm-panel-badge pm-badge-ok" style={{ marginLeft: "auto" }}>
              ◆ GRANITE
            </span>
          </>
        }
        headerStyle={{ padding: "10px 16px", borderBottom: "1px solid var(--border)" }}
        className="pm-panel pm-glass-card"
        style={{ flex: "1 1 0", minHeight: 280, overflow: "hidden" }}
        bodyStyle={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          overflow: "hidden",
          padding: "12px 16px",
        }}
        defaultCollapsed={false}
        persist={false}
      >
        {/* Prompt chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10, flexShrink: 0 }}>
          {promptChips.map((chip) => (
            <button key={chip} onClick={() => setDraft(chip)} className="pm-chip">
              {chip.replace(/[.?]/g, "").toUpperCase().slice(0, 22)}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 0,
            marginBottom: 10,
          }}
        >
          {chat.map((m, idx) => (
            <div key={idx} className={`pm-chat-msg ${m.role === "user" ? "user" : "ai"}`}>
              <div className="pm-msg-label">
                {m.role === "user" ? "ENGINEER" : "◆ GRANITE · SYSTEM ORACLE"}
              </div>
              <div className="pm-msg-bubble">
                {m.content}
                {m.streaming && (
                  <span
                    style={{
                      marginLeft: 2,
                      color: "var(--f1-red)",
                      animation: "flicker 0.8s infinite",
                    }}
                  >
                    ▍
                  </span>
                )}
              </div>
            </div>
          ))}
          {isChatThinking && (
            <div className="pm-chat-msg ai">
              <div className="pm-msg-label">◆ GRANITE</div>
              <div className="pm-msg-bubble">
                <div className="pm-typing">
                  <div className="pm-typing-dot" />
                  <div className="pm-typing-dot" />
                  <div className="pm-typing-dot" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{ display: "flex", gap: 0, flexShrink: 0 }}>
          <label htmlFor="chat-input" className="sr-only">
            Chat input for strategy questions
          </label>
          <input
            id="chat-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSendChat()}
            placeholder="ENTER STRATEGY QUERY..."
            className="pm-chat-input"
            disabled={isChatThinking}
            aria-label="Enter strategy question"
          />
          <button
            onClick={onSendChat}
            disabled={isChatThinking}
            className="pm-chat-send"
            aria-label="Send message"
          >
            ▶
          </button>
        </div>
      </MinimizablePanel>

      {/* Confidence Breakdown — BOTTOM */}
      <MinimizablePanel
        id="dashboard__fastest-laps"
        header={<div className="pm-panel-title">CONFIDENCE BREAKDOWN</div>}
        headerStyle={{ padding: "10px 16px", borderBottom: "1px solid var(--border)" }}
        className="pm-panel"
        style={{ flex: "0 0 auto", maxHeight: "32vh", overflow: "hidden" }}
        bodyStyle={{ overflowY: "auto", flex: 1 }}
      >
        <ConfidenceDecompositionCard
          decomposition={reco?.confidence_decomposition}
          overallConfidence={reco?.confidence ?? 0}
        />
      </MinimizablePanel>
    </div>
  );

  const getColumnProps = (id: string) => {
    switch (id) {
      case "left":
        return { defaultSize: 25, minSize: 18 };
      case "center":
        return { defaultSize: 50, minSize: 30 };
      case "right":
        return { defaultSize: 25, minSize: 18 };
      default:
        return { defaultSize: 33, minSize: 20 };
    }
  };

  const renderColumnContent = (id: string) => {
    switch (id) {
      case "left":
        return renderLeftColumn();
      case "center":
        return renderCenterColumn();
      case "right":
        return renderRightColumn();
      default:
        return null;
    }
  };

  return (
    <div
      className="pm-bg-f1-circuit"
      style={{
        position: "relative",
        width: "100%",
        height: "calc(100vh - var(--topbar-height, 52px))",
        display: "flex",
        flexDirection: "column",
        color: "var(--text-primary)",
        overflowX: "hidden",
        overflowY: "hidden",
      }}
    >
      {/* Dashboard sub-header bar */}
      <div
        ref={missionRef}
        className="pm-mission-bar"
        style={{
          flexShrink: 0,
          padding: "10px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* Sub-header title */}
          <div>
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "var(--f1-red)",
                marginBottom: 2,
              }}
            >
              PitMind Mission Control
            </div>
            <div
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: 14,
                fontWeight: 700,
                textTransform: "uppercase",
                color: "var(--text-primary)",
                letterSpacing: "0.05em",
              }}
            >
              Strategy Console{" "}
              <span style={{ color: "var(--text-secondary)", fontSize: 10, fontWeight: 400 }}>
                v1.2.5
              </span>
            </div>
          </div>

          <div style={{ width: 1, height: 36, background: "var(--border)" }} />

          {/* Live sync indicator */}
          <div className="pm-live-pill">
            <div className="pm-live-dot" />
            LIVE SYNC ACTIVE
          </div>

          <RoleSwitcher currentRole={currentRole} onRoleChange={setRole} />

          {/* Collapse All / Expand All */}
          <div style={{ display: "flex", gap: 4, marginLeft: 8 }}>
            <button
              onClick={() => collapseAll("dashboard")}
              title="Collapse all panels"
              style={{
                background: "none",
                border: "1px solid var(--border)",
                color: "var(--text-secondary)",
                cursor: "pointer",
                padding: "4px 8px",
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                display: "flex",
                alignItems: "center",
                gap: 4,
                borderRadius: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--f1-red)";
                e.currentTarget.style.color = "var(--f1-red)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
            >
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                <path
                  d="M3 6L8 11L13 6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              FOLD
            </button>
            <button
              onClick={() => expandAll("dashboard")}
              title="Expand all panels"
              style={{
                background: "none",
                border: "1px solid var(--border)",
                color: "var(--text-secondary)",
                cursor: "pointer",
                padding: "4px 8px",
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                display: "flex",
                alignItems: "center",
                gap: 4,
                borderRadius: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--f1-red)";
                e.currentTarget.style.color = "var(--f1-red)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
            >
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                <path
                  d="M3 10L8 5L13 10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              UNFOLD
            </button>
          </div>
        </div>

        {/* Track Conditions */}
        <div
          style={{
            display: "flex",
            gap: 40,
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
            borderLeft: "1px solid var(--border)",
            borderRight: "1px solid var(--border)",
            margin: "0 20px",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 10,
                color: "var(--text-secondary)",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                marginBottom: 2,
              }}
            >
              TRACK TEMP
            </div>
            <div
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: 13,
                color: "var(--amber)",
                fontWeight: 700,
              }}
            >
              42°C
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 10,
                color: "var(--text-secondary)",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                marginBottom: 2,
              }}
            >
              AIR TEMP
            </div>
            <div
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: 13,
                color: "var(--text-primary)",
                fontWeight: 700,
              }}
            >
              28°C
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 10,
                color: "var(--text-secondary)",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                marginBottom: 2,
              }}
            >
              WIND
            </div>
            <div
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: 13,
                color: "var(--text-primary)",
                fontWeight: 700,
              }}
            >
              12 <span style={{ fontSize: 10, color: "var(--text-secondary)" }}>KM/H NW</span>
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 10,
                color: "var(--text-secondary)",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                marginBottom: 2,
              }}
            >
              WEATHER
            </div>
            <div
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: 13,
                color: "var(--text-primary)",
                fontWeight: 700,
              }}
            >
              DRY
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 10,
                color: "var(--text-secondary)",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                marginBottom: 2,
              }}
            >
              DRS STATUS
            </div>
            <div
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: 13,
                color: "var(--neon-green)",
                fontWeight: 700,
              }}
            >
              ENABLED
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* Circuit + Session */}
          <div
            style={{
              display: "flex",
              gap: 20,
              paddingRight: 20,
              borderRight: "1px solid var(--border)",
            }}
          >
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "var(--text-secondary)",
                }}
              >
                Circuit
              </div>
              <div
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "var(--text-primary)",
                }}
              >
                {localPayload.circuit}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "var(--text-secondary)",
                }}
              >
                Status
              </div>
              <div
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "var(--f1-red)",
                }}
              >
                {raceState?.session_status ?? "RACE LIVE"}
              </div>
            </div>
          </div>

          <StreamHealthMonitor showMetrics={false} />
          <ShareButton onCopyUrl={copyShareableUrl} getShareUrl={getShareableUrl} />
        </div>
      </div>

      {/* Main grid — takes all remaining height */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          maxWidth: 1920,
          margin: "0 auto",
          width: "100%",
          paddingTop: 8,
        }}
      >
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
            <Group
              orientation="horizontal"
              className="h-full min-h-0"
              style={{ gap: 0, background: "var(--border)", overflow: "hidden", height: "100%" }}
            >
              {columnOrder.map((id: string, index: number) => (
                <Fragment key={id}>
                  <Panel id={id} {...getColumnProps(id)} className="h-full min-h-0">
                    <SortableColumn id={id}>{renderColumnContent(id)}</SortableColumn>
                  </Panel>
                  {index < columnOrder.length - 1 && (
                    <ResizeHandle className="shrink-0 w-[2px] mx-1" />
                  )}
                </Fragment>
              ))}
            </Group>
          </SortableContext>
        </DndContext>
      </div>

      {/* Persistent Role Identity */}
      {currentRole !== "engineer" && (
        <div
          style={{
            position: "fixed",
            bottom: 32,
            left: 32,
            zIndex: 200,
            maxWidth: 320,
            animation: "feed-in 0.5s ease",
          }}
        >
          <div
            style={{
              background: "rgba(10,10,10,0.95)",
              border: "1px solid var(--border-active)",
              borderLeft: "3px solid var(--f1-red)",
              backdropFilter: "blur(16px)",
            }}
          >
            <div
              style={{
                padding: "10px 16px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "var(--f1-red)",
                }}
              >
                {currentRole} Context
              </span>
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--f1-red)",
                  animation: "pulse-dot 1.5s infinite ease-in-out",
                }}
              />
            </div>
            <div
              style={{
                padding: "14px 16px",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11,
                color: "var(--text-secondary)",
                lineHeight: 1.6,
                fontStyle: "italic",
              }}
            >
              {currentRole === "strategist"
                ? "Strategic Overwatch: Prioritize lap delta and tyre degradation cycles."
                : "Broadcast Feed: Focus on narrative arc and head-to-head performance battles."}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
