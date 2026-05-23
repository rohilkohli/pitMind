/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, Suspense, lazy, Fragment } from "react";
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

import * as Resizable from "react-resizable-panels";
const { Panel, Group } = Resizable;
import { ResizeHandle } from "../components/ui/ResizeHandle";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, horizontalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { SortableColumn } from '../components/layout/SortableColumn';

const LapChart = lazy(() => import("../components/dashboard/LapChart").then(m => ({ default: m.LapChart })));
const PostRaceDebrief = lazy(() => import("../components/dashboard/PostRaceDebrief").then(m => ({ default: m.PostRaceDebrief })));
const DecisionLog = lazy(() => import("../components/dashboard/DecisionLog").then(m => ({ default: m.DecisionLog })));

export function Strategy() {
  const { raceState } = useFirebaseRaceState("current_race");
  const { currentRole, setRole } = useRole();
  const { getShareableUrl, copyShareableUrl } = useDashboardState({ timeFilter: 'live' });
  const { payload: localPayload } = useTelemetry(demoDriverA);

  const [reco, setReco] = useState<StrategyRecommendation | null>(null);

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
            explanation: "Tyre wear at 73%. Lap time degradation trend\nexceeds threshold. Pit window optimal at current lap.",
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
              recommended_window_laps: [18, 25]
            },
            structured_reasons: [
              "Tyre wear at 73% exceeds critical threshold",
              "Lap time degradation trend exceeds normal limits",
              "Pit window optimal at current lap"
            ],
            pipeline_steps: [
              "FastF1 Data Load Completed",
              "Tyre Wear Assessment Completed",
              "Race Simulation Completed",
              "Granite Strategy Suggestion Generated"
            ],
            confidence_decomposition: {
              data_quality: 92,
              model_certainty: 84,
              stability: 78,
              regret_bound: 0.16
            }
          });
        }
      }
    }
    autoLoad();
    return () => {
      active = false;
    };
  }, [localPayload]);

  const mockChartData = localPayload.laps.map(lap => ({
    lap: lap.lap,
    VER: lap.lap_time_s || 0,
    LEC: (lap.lap_time_s || 0) + 0.3,
    NOR: (lap.lap_time_s || 0) + 0.5,
    HAM: (lap.lap_time_s || 0) + 1.2,
  }));

  const [columnOrder, setColumnOrder] = useState(() => {
    const saved = localStorage.getItem('pitmind_strategy_layout');
    return saved ? JSON.parse(saved) : ['left', 'center', 'right'];
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: any) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setColumnOrder((items: string[]) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        localStorage.setItem('pitmind_strategy_layout', JSON.stringify(newOrder));
        return newOrder;
      });
    }
  }

  const renderLeftColumn = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "var(--border)", height: "100%", overflowY: "auto", paddingBottom: 80 }}>
      <div className="pm-panel" style={{ flex: "1 1 auto", minHeight: 300 }}>
        <div className="pm-panel-header">
          <div className="pm-panel-title">Strategy Timeline</div>
          <span className="pm-panel-badge pm-badge-ok">LIVE</span>
        </div>
        <StrategyTimeline
          reco={reco}
          strategyChecklistKey={`pitmind.strategy.checklist.${localPayload.circuit}.${localPayload.session_label}.${localPayload.driver}`}
          onInjectBriefToChat={() => {}}
          onCommitStrategy={async () => { return {} as any; }}
        />
      </div>
      <div className="pm-panel" style={{ flex: "1 1 auto", minHeight: 300 }}>
        <div className="pm-panel-header">
          <div className="pm-panel-title">Branching Simulator</div>
          <span className="pm-panel-badge pm-badge-ai">GRANITE</span>
        </div>
        <BranchingSimulator onSelectScenario={() => {}} />
      </div>
    </div>
  );

  const renderCenterColumn = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "var(--border)", height: "100%", overflowY: "auto", paddingBottom: 80 }}>
      <div className="pm-panel" style={{ flex: "1 1 auto", minHeight: 400 }}>
        <div className="pm-panel-header">
          <div className="pm-panel-title">Telemetry Lap Chart</div>
        </div>
        <Suspense fallback={<div className="skeleton-row" style={{ height: 400 }} />}>
          <LapChart data={mockChartData} />
        </Suspense>
      </div>
      <div className="pm-panel" style={{ flex: "0 0 auto", minHeight: 300 }}>
        <Suspense fallback={<div className="skeleton-row" style={{ height: 300 }} />}>
          <PostRaceDebrief />
        </Suspense>
      </div>
    </div>
  );

  const renderRightColumn = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "var(--border)", height: "100%", overflowY: "auto", paddingBottom: 80 }}>
      <div className="pm-panel" style={{ flex: "0 0 auto" }}>
        <ConfidenceDecompositionCard
          decomposition={reco?.confidence_decomposition}
          overallConfidence={reco?.confidence ?? 0}
        />
      </div>
      <div className="pm-panel" style={{ flex: "1 1 auto", minHeight: 400 }}>
        <Suspense fallback={<div className="skeleton-row" style={{ height: 400 }} />}>
          <DecisionLog onExportSession={() => {}} />
        </Suspense>
      </div>
    </div>
  );

  const getColumnProps = (id: string) => {
    switch (id) {
      case 'left': return { defaultSize: 25, minSize: 18 };
      case 'center': return { defaultSize: 50, minSize: 30 };
      case 'right': return { defaultSize: 25, minSize: 18 };
      default: return { defaultSize: 33, minSize: 20 };
    }
  };

  const renderColumnContent = (id: string) => {
    switch (id) {
      case 'left': return renderLeftColumn();
      case 'center': return renderCenterColumn();
      case 'right': return renderRightColumn();
      default: return null;
    }
  };

  return (
    <div
      className="pm-bg-f1-circuit"
      style={{
        position: "relative",
        minHeight: "100vh",
        width: "100%",
        color: "var(--text-primary)",
        overflowX: "hidden",
      }}
    >
      {/* Sub-header bar */}
      <div
        style={{
          borderBottom: "1px solid var(--border)",
          background: "rgba(10,10,10,0.9)",
          padding: "10px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 52,
          zIndex: 100,
          backdropFilter: "blur(12px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div>
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 9,
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
              Strategy Workspace <span style={{ color: "var(--text-secondary)", fontSize: 10, fontWeight: 400 }}>v1.2.5</span>
            </div>
          </div>
          <div style={{ width: 1, height: 36, background: "var(--border)" }} />
          <div className="pm-live-pill">
            <div className="pm-live-dot" />
            LIVE SYNC ACTIVE
          </div>
          <RoleSwitcher currentRole={currentRole} onRoleChange={setRole} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ display: "flex", gap: 20, paddingRight: 20, borderRight: "1px solid var(--border)" }}>
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 9,
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
                  fontSize: 9,
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

      {/* Grid Layout upgraded to dnd-kit resizable panels */}
      <div style={{ maxWidth: 1920, margin: "0 auto", padding: 0, height: "calc(100vh - 104px)" }}>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
            <Group orientation="horizontal" className="h-full" style={{ gap: 0, background: "var(--border)" }}>
              {columnOrder.map((id: string, index: number) => (
                <Fragment key={id}>
                  <Panel id={id} {...getColumnProps(id)} className="h-full">
                    <SortableColumn id={id}>
                      {renderColumnContent(id)}
                    </SortableColumn>
                  </Panel>
                  {index < columnOrder.length - 1 && <ResizeHandle />}
                </Fragment>
              ))}
            </Group>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
