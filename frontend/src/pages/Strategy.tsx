import { useEffect, useRef, useState, Suspense, lazy, Fragment } from "react";
import { useFirebaseRaceState } from "../hooks/useFirebaseRaceState";
import { useDashboardState } from "../hooks/useDashboardState";
import { useTelemetry } from "../hooks/useTelemetry";
import { demoDriverA } from "../data/demoTelemetry";
import { postRecommend, type StrategyRecommendation } from "../services/api";
import { auth } from "../lib/firebase";

import { StrategyTimeline } from "../components/dashboard/StrategyTimeline";
import { BranchingSimulator } from "../components/dashboard/BranchingSimulator";
import { ConfidenceDecompositionCard } from "../components/dashboard/ConfidenceDecompositionCard";
import { ShareButton } from "../components/dashboard/ShareButton";
import { StreamHealthMonitor } from "../components/dashboard/StreamHealthMonitor";
import { RoleSwitcher } from "../components/dashboard/RoleSwitcher";
import { useRole } from "../contexts/RoleContext";
import { MinimizablePanel } from "../components/ui/MinimizablePanel";
import { usePanelStateContext } from "../contexts/PanelStateContext";

import * as Resizable from "react-resizable-panels";
const { Panel, Group } = Resizable;
import { ResizeHandle } from "../components/ui/ResizeHandle";
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
import { ChevronDown, ChevronUp } from "lucide-react";

const LapChart = lazy(() =>
  import("../components/dashboard/LapChart").then((m) => ({ default: m.LapChart })),
);
const PostRaceDebrief = lazy(() =>
  import("../components/dashboard/PostRaceDebrief").then((m) => ({ default: m.PostRaceDebrief })),
);
const DecisionLog = lazy(() =>
  import("../components/dashboard/DecisionLog").then((m) => ({ default: m.DecisionLog })),
);

export function Strategy() {
  const { raceState } = useFirebaseRaceState("current_race");
  const { currentRole, setRole } = useRole();
  const { getShareableUrl, copyShareableUrl } = useDashboardState({ timeFilter: "live" });
  const { payload: localPayload } = useTelemetry(demoDriverA);
  const { collapseAll, expandAll } = usePanelStateContext();

  const [reco, setReco] = useState<StrategyRecommendation | null>(null);
  const missionRef = useRef<HTMLDivElement>(null);
  const [missionH, setMissionH] = useState(0);

  useEffect(() => {
    let active = true;
    async function autoLoad() {
      try {
        const token = await auth?.currentUser?.getIdToken();
        const result = await postRecommend(localPayload, token || undefined);
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
      }
    }
    autoLoad();
    return () => {
      active = false;
    };
  }, [localPayload]);

  const mockChartData = localPayload.laps.map((lap) => ({
    lap: lap.lap,
    VER: lap.lap_time_s || 0,
    LEC: (lap.lap_time_s || 0) + 0.3,
    NOR: (lap.lap_time_s || 0) + 0.5,
    HAM: (lap.lap_time_s || 0) + 1.2,
  }));

  const [columnOrder, setColumnOrder] = useState(() => {
    try {
      const saved = localStorage.getItem("pitmind_strategy_layout");
      return saved ? JSON.parse(saved) : ["left", "center", "right"];
    } catch {
      return ["left", "center", "right"];
    }
  });

  useEffect(() => {
    if (!missionRef.current) return;

    const updateMissionHeight = () => {
      setMissionH(missionRef.current?.offsetHeight ?? 0);
    };

    updateMissionHeight();
    const obs = new ResizeObserver(updateMissionHeight);
    obs.observe(missionRef.current);
    return () => obs.disconnect();
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
        localStorage.setItem("pitmind_strategy_layout", JSON.stringify(newOrder));
        return newOrder;
      });
    }
  }

  // ─── LEFT COLUMN: AI Reasoning Trace ──────────────────────────────────────
  const renderLeftColumn = () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 1,
        background: "var(--border)",
        height: "100%",
        minHeight: 0,
        overflow: "hidden",
        minWidth: 300,
      }}
    >
      <MinimizablePanel
        id="strategy__ai-reasoning-trace"
        defaultCollapsed={false}
        persist={false}
        showToggle={false}
        header={
          <>
            <div className="pm-panel-title">AI REASONING TRACE</div>
            <span className="pm-panel-badge pm-badge-ok">
              {reco ? `${reco.confidence.toFixed(0)}%` : "LIVE"}
            </span>
          </>
        }
        headerStyle={{ padding: "10px 16px", borderBottom: "1px solid var(--border)" }}
        bodyStyle={{ flex: 1, minHeight: 0, overflowY: "auto" }}
        style={{ flex: 1, minHeight: 0 }}
        className="pm-panel"
      >
        <StrategyTimeline
          reco={reco}
          strategyChecklistKey={`pitmind.strategy.checklist.${localPayload.circuit}.${localPayload.session_label}.${localPayload.driver}`}
          onInjectBriefToChat={() => {}}
          onCommitStrategy={async () => {
            // TODO: Implement strategy commit functionality
            return {
              message: "Strategy commit not yet implemented",
              audit_id: "",
              timestamp: new Date().toISOString()
            };
          }}
          showHeader={false}
        />
      </MinimizablePanel>
    </div>
  );

  // ─── CENTER COLUMN: Branching Simulator → Post-Race Debrief → Lap Time Trace
  const renderCenterColumn = () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 1,
        background: "var(--border)",
        height: "100%",
        minHeight: 0,
        overflow: "hidden",
        minWidth: 0,
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
        {/* 1. Branching Simulator — top */}
        <MinimizablePanel
          id="strategy__branching-simulator"
          header={
            <>
              <div className="pm-panel-title">BRANCHING SIMULATOR</div>
              <span
                className="pm-panel-badge"
                style={{
                  background: "var(--f1-red-dim)",
                  color: "var(--f1-red)",
                  border: "1px solid var(--f1-red)",
                  fontWeight: 700,
                }}
              >
                GRANITE
              </span>
            </>
          }
          headerStyle={{ padding: "10px 16px", borderBottom: "1px solid var(--border)" }}
          bodyStyle={{ overflowY: "auto", flex: 1 }}
          style={{ flex: "0 0 auto", minHeight: 48, maxHeight: "70vh" }}
          className="pm-panel"
        >
          <BranchingSimulator onSelectScenario={() => {}} />
        </MinimizablePanel>

        {/* 2. Post-Race Debrief — middle */}
        <MinimizablePanel
          id="strategy__post-race-debrief"
          header={
            <>
              <div className="pm-panel-title">POST-RACE DEBRIEF</div>
              <span className="pm-chip">DOCLING ENABLED</span>
            </>
          }
          headerStyle={{ padding: "10px 16px", borderBottom: "1px solid var(--border)" }}
          style={{ flex: "0 0 auto", minHeight: 48 }}
          className="pm-panel"
        >
          <Suspense fallback={<div className="skeleton-row" style={{ height: 300 }} />}>
            <PostRaceDebrief showHeader={false} />
          </Suspense>
        </MinimizablePanel>

        {/* 3. Lap Time Trace — bottom */}
        <MinimizablePanel
          id="strategy__lap-time-trace"
          defaultCollapsed={false}
          persist={false}
          header={<div className="pm-panel-title">LAP TIME TRACE</div>}
          headerStyle={{ padding: "10px 16px", borderBottom: "1px solid var(--border)" }}
          bodyStyle={{ height: 380, overflow: "hidden", flexShrink: 0 }}
          style={{ flex: "0 0 auto", minHeight: 48 }}
          className="pm-panel"
        >
          <Suspense fallback={<div className="skeleton-row" style={{ height: 380 }} />}>
            <LapChart data={mockChartData} fillHeight showTitle={false} />
          </Suspense>
        </MinimizablePanel>
      </div>
    </div>
  );

  // ─── RIGHT COLUMN: Decision Log + Confidence Breakdown ────────────────────
  const renderRightColumn = () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 1,
        background: "var(--border)",
        height: "100%",
        minHeight: 0,
        overflow: "hidden",
        minWidth: 320,
      }}
    >
      {/* Decision Log — scrollable within its own capped height */}
      <MinimizablePanel
        id="strategy__decision-log"
        header={<div className="pm-panel-title">DECISION LOG</div>}
        headerStyle={{ padding: "10px 16px", borderBottom: "1px solid var(--border)" }}
        bodyStyle={{ overflowY: "auto", flex: 1 }}
        style={{ flex: "1 1 0", minHeight: 48, maxHeight: "60vh", overflow: "hidden" }}
        className="pm-panel"
      >
        <Suspense fallback={<div className="skeleton-row" style={{ height: 200 }} />}>
          <DecisionLog onExportSession={() => {}} showHeader={false} />
        </Suspense>
      </MinimizablePanel>

      {/* Confidence Breakdown — always visible at bottom, fixed height */}
      <MinimizablePanel
        id="strategy__confidence-breakdown"
        header={<div className="pm-panel-title">CONFIDENCE BREAKDOWN</div>}
        headerStyle={{ padding: "10px 16px", borderBottom: "1px solid var(--border)" }}
        bodyStyle={{ overflowY: "auto", flex: 1 }}
        style={{ flex: "0 0 auto", minHeight: 48, maxHeight: "45vh", overflow: "hidden" }}
        className="pm-panel"
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
        return { defaultSize: 24, minSize: 20 };
      case "center":
        return { defaultSize: 52, minSize: 10 };
      case "right":
        return { defaultSize: 24, minSize: 22 };
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
        color: "var(--text-primary)",
        overflowX: "hidden",
        overflowY: "hidden",
        minHeight: "calc(100vh - var(--topbar-height, 52px))",
        height: "calc(100vh - var(--topbar-height, 52px))",
      }}
    >
      {/* Sub-header bar */}
      <div
        ref={missionRef}
        className="pm-mission-bar"
        style={{
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
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
              Strategy Workspace{" "}
              <span style={{ color: "var(--text-secondary)", fontSize: 10, fontWeight: 400 }}>
                v1.2.5
              </span>
            </div>
          </div>
          <div style={{ width: 1, height: 36, background: "var(--border)" }} />
          <div className="pm-live-pill">
            <div className="pm-live-dot" />
            LIVE SYNC ACTIVE
          </div>
          <RoleSwitcher currentRole={currentRole} onRoleChange={setRole} />
          {/* Collapse All / Expand All */}
          <div style={{ display: "flex", gap: 4, marginLeft: 8 }}>
            <button
              onClick={() => collapseAll("strategy")}
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
              <ChevronDown size={12} />
              FOLD
            </button>
            <button
              onClick={() => expandAll("strategy")}
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
              <ChevronUp size={12} />
              UNFOLD
            </button>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
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

      {/* Grid Layout */}
      <div
        style={{
          maxWidth: 1920,
          margin: "0 auto",
          paddingTop: 8,
          height: missionH
            ? `calc(100vh - var(--topbar-height, 52px) - ${missionH}px)`
            : "calc(100vh - var(--topbar-height, 52px) - 58px)",
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
            <Group
              orientation="horizontal"
              className="h-full min-h-0"
              style={{ gap: 0, background: "var(--border)", overflow: "hidden" }}
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
    </div>
  );
}
