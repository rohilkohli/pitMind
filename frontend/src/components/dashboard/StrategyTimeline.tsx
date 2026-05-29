import { useEffect, useMemo, useState, useRef } from "react";
import { AlertTriangle, ClipboardCheck, Gauge, Lock, ShieldCheck, TimerReset } from "lucide-react";
import type { StrategyCommitResponse, StrategyRecommendation } from "../../services/api";
import { EvidenceDrilldownModal, type EvidenceDrilldown } from "./EvidenceDrilldownModal";

export type StrategyChecklistState = {
  pitCrewReady: boolean;
  tyreSetConfirmed: boolean;
  radioCallPrepared: boolean;
};

export type StrategyPanelCommitPayload = {
  executionBrief: string;
  checklist: StrategyChecklistState;
};

type StrategyTimelineProps = {
  reco: StrategyRecommendation | null;
  strategyChecklistKey?: string;
  onInjectBriefToChat?: (brief: string) => void;
  onCommitStrategy?: (payload: StrategyPanelCommitPayload) => Promise<StrategyCommitResponse>;
  showHeader?: boolean;
};

type ScoreRowProps = {
  label: string;
  value: number;
  tone: "safe" | "warn" | "risk";
};

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, value));
}

function ScoreRow({ label, value, tone }: ScoreRowProps) {
  const colorClass =
    tone === "safe"
      ? "bg-[var(--neon-green)]"
      : tone === "warn"
        ? "bg-[var(--amber)]"
        : "bg-[var(--f1-red)]";
  return (
    <div>
      <div className="mb-1 flex items-center justify-between font-tele">
        <span className="text-[10px] font-label uppercase tracking-wider text-[var(--text-secondary)]">
          {label}
        </span>
        <span className="font-semibold text-[11px] text-[var(--text-primary)]">
          {value.toFixed(0)}%
        </span>
      </div>
      <div className="h-1.5 w-full bg-[var(--carbon-light)]">
        <div className={`h-full ${colorClass}`} style={{ width: `${clampPercent(value)}%` }} />
      </div>
    </div>
  );
}

function confidenceTone(confidence: number) {
  if (confidence >= 70) return "text-[var(--neon-green)]";
  if (confidence >= 45) return "text-[var(--amber)]";
  return "text-[var(--f1-red)]";
}

export function StrategyTimeline({
  reco,
  strategyChecklistKey = "pitmind.strategy.checklist.default",
  onInjectBriefToChat,
  onCommitStrategy,
  showHeader = true,
}: StrategyTimelineProps) {
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceDrilldown | null>(null);
  const [checklist, setChecklist] = useState<StrategyChecklistState>({
    pitCrewReady: false,
    tyreSetConfirmed: false,
    radioCallPrepared: false,
  });

  const [briefCopied, setBriefCopied] = useState(false);
  const [commitState, setCommitState] = useState<{
    loading: boolean;
    message: string;
    isError: boolean;
  }>({
    loading: false,
    message: "",
    isError: false,
  });

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(strategyChecklistKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<StrategyChecklistState>;
      setChecklist({
        pitCrewReady: Boolean(parsed.pitCrewReady),
        tyreSetConfirmed: Boolean(parsed.tyreSetConfirmed),
        radioCallPrepared: Boolean(parsed.radioCallPrepared),
      });
    } catch {
      setChecklist({
        pitCrewReady: false,
        tyreSetConfirmed: false,
        radioCallPrepared: false,
      });
    }
  }, [strategyChecklistKey]);

  // Keep track of latest checklist state in a ref to avoid stale closures on unmount
  const checklistRef = useRef(checklist);
  useEffect(() => {
    checklistRef.current = checklist;
  }, [checklist]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      window.localStorage.setItem(strategyChecklistKey, JSON.stringify(checklist));
    }, 150); // 150ms debounce

    return () => clearTimeout(timeoutId);
  }, [checklist, strategyChecklistKey]);

  // Ensure final state is saved on unmount using the ref
  useEffect(() => {
    return () => {
      window.localStorage.setItem(strategyChecklistKey, JSON.stringify(checklistRef.current));
    };
  }, [strategyChecklistKey]);

  const executionBrief = useMemo(() => {
    if (!reco) return "";
    const windowStart = reco.scores?.recommended_window_laps?.[0] ?? "-";
    const windowEnd = reco.scores?.recommended_window_laps?.[1] ?? "-";
    const confidence = Math.max(0, Math.min(100, reco.confidence));
    const pitCall = reco.pit_this_lap ? "Pit this lap" : "Hold this lap";
    return [
      `Primary action: ${reco.action}`,
      `Immediate call: ${pitCall}`,
      `Target compound: ${reco.suggested_compound}`,
      `Recommended pit window: L${windowStart} to L${windowEnd}`,
      `Confidence: ${confidence.toFixed(1)}%`,
      `Alternative: ${reco.alternative}`,
    ].join("\n");
  }, [reco]);

  if (!reco) {
    return (
      <div
        className="flex h-full flex-col items-center justify-center p-8 text-center relative overflow-hidden bg-[var(--carbon-mid)]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(225,6,0,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(225,6,0,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "20px 20px",
        }}
      >
        <div className="relative z-10 flex flex-col items-center">
          <Lock className="w-10 h-10 text-[var(--border)] mb-4" />
          <p className="font-label text-[18px] font-semibold text-[var(--text-secondary)] uppercase tracking-widest leading-tight mb-2">
            Generate a strategy to <br /> unlock the reasoning trace
          </p>
          <p className="text-[10px] font-tele uppercase text-[var(--text-secondary)] max-w-[200px]">
            The viewer fills in with evidence, confidence, and alternate calls.
          </p>
          <div className="mt-[24px] grid grid-cols-2 gap-[12px] text-left">
            <div className="border border-[var(--border)] bg-[var(--carbon-light)] px-3 py-2">
              <p className="text-[9px] font-label font-black uppercase tracking-wider text-[var(--text-secondary)]">
                Awaiting
              </p>
              <p className="mt-1 text-[11px] font-tele uppercase font-bold text-[var(--text-primary)]">
                Recommendation
              </p>
            </div>
            <div className="border border-[var(--border)] bg-[var(--carbon-light)] px-3 py-2">
              <p className="text-[9px] font-label font-black uppercase tracking-wider text-[var(--text-secondary)]">
                Awaiting
              </p>
              <p className="mt-1 text-[11px] font-tele uppercase font-bold text-[var(--text-primary)]">
                Risk Model
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const steps = reco.pipeline_steps ?? [];
  const reasons = reco.structured_reasons ?? [];
  const evidence = reco.evidence ?? [];
  const assumptions = reco.assumptions ?? [];
  const confidence = Math.max(0, Math.min(100, reco.confidence));
  const windowStart = reco.scores?.recommended_window_laps?.[0] ?? "-";
  const windowEnd = reco.scores?.recommended_window_laps?.[1] ?? "-";
  const pitUrgency = clampPercent(reco.scores?.pit_urgency ?? 0);
  const scProbability = clampPercent(reco.scores?.sc_probability_next_3_laps ?? 0);
  const overtakeRisk = clampPercent(reco.scores?.overtake_risk ?? 0);

  const readinessCount =
    Number(checklist.pitCrewReady) +
    Number(checklist.tyreSetConfirmed) +
    Number(checklist.radioCallPrepared);
  const readinessPct = (readinessCount / 3) * 100;

  // Mock drill-down data generator (in production, this would come from backend)
  const generateEvidenceDrilldown = (evidenceText: string, index: number): EvidenceDrilldown => {
    const lapRange: [number, number] = [Math.max(1, 20 - index * 5), Math.min(50, 25 - index * 5)];
    const dataPoints = Array.from({ length: lapRange[1] - lapRange[0] + 1 }, (_, i) => ({
      lap: lapRange[0] + i,
      value: Math.random() * 30 + 60 + (i % 2 ? -2 : 0),
    }));

    const trend = index % 3 === 0 ? "improving" : index % 3 === 1 ? "degrading" : "stable";

    return {
      evidence: evidenceText,
      metric: "Tyre Wear / Gap Trend / Fuel Delta",
      lapRange,
      dataPoints,
      trend,
      confidence: 0.75 + Math.random() * 0.2,
    };
  };

  async function onCopyBrief() {
    try {
      await navigator.clipboard.writeText(executionBrief);
      setBriefCopied(true);
      window.setTimeout(() => setBriefCopied(false), 1500);
    } catch {
      setBriefCopied(false);
    }
  }

  async function onCommit() {
    if (!onCommitStrategy) {
      return;
    }

    setCommitState({ loading: true, message: "Committing strategy...", isError: false });
    try {
      const response = await onCommitStrategy({
        executionBrief,
        checklist,
      });
      setCommitState({
        loading: false,
        message: `Committed (${response.audit_id})`,
        isError: false,
      });
    } catch (error) {
      setCommitState({
        loading: false,
        message: `Commit failed: ${String(error)}`,
        isError: true,
      });
    }
  }

  function toggleChecklist(key: "pitCrewReady" | "tyreSetConfirmed" | "radioCallPrepared") {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <>
      <div className="flex h-full flex-col overflow-hidden min-h-0">
        {showHeader && (
          <div className="sticky top-0 z-10 shrink-0 border-b border-[var(--border)] bg-[var(--carbon)] px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xs font-label uppercase tracking-widest text-[var(--text-primary)]">
                  AI Reasoning Trace
                </h2>
                <p className="mt-1 font-tele text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">
                  Model output with guardrails and structured evidence
                </p>
              </div>
              <span className="pm-chip">{confidence.toFixed(0)}% CONFIDENCE</span>
            </div>
          </div>
        )}

        <div
          className="space-y-5 overflow-y-auto px-4 py-4 flex-1 min-h-0"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#ff1801 #1a1a1a" }}
        >
          <div className="pm-panel border-l-4 border-[var(--f1-red)] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-label uppercase tracking-widest text-[var(--text-secondary)]">
                  Recommendation
                </span>
                <h3 className="mt-2 text-xl font-label font-black uppercase text-[var(--text-primary)]">
                  {reco.action}
                </h3>
              </div>
              <div className="border border-[var(--border)] bg-[var(--carbon-mid)] px-3 py-2 text-right">
                <div className="text-[10px] font-label uppercase tracking-widest text-[var(--text-secondary)]">
                  Compound
                </div>
                <div className="font-tele text-sm text-[var(--text-primary)] font-semibold mt-1">
                  {reco.suggested_compound}
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-[var(--text-secondary)] font-tele">
              <div className="border border-[var(--border)] bg-[var(--carbon-mid)] px-3 py-2">
                <div className="font-label text-[10px] uppercase tracking-widest">Pit</div>
                <div className="mt-1 font-semibold text-[var(--text-primary)]">
                  {String(reco.pit_this_lap)}
                </div>
              </div>
              <div className="border border-[var(--border)] bg-[var(--carbon-mid)] px-3 py-2">
                <div className="font-label text-[10px] uppercase tracking-widest">Window</div>
                <div className="mt-1 font-semibold text-[var(--text-primary)]">
                  {windowStart}-{windowEnd}
                </div>
              </div>
              <div className="border border-[var(--border)] bg-[var(--carbon-mid)] px-3 py-2">
                <div className="font-label text-[10px] uppercase tracking-widest">Confidence</div>
                <div className={`mt-1 font-semibold ${confidenceTone(confidence)}`}>
                  {confidence.toFixed(1)}%
                </div>
              </div>
            </div>

            <div className="mt-4 h-2 bg-[var(--carbon-light)]">
              <div className="h-full bg-[var(--f1-red)]" style={{ width: `${confidence}%` }} />
            </div>
          </div>

          <div className="pm-panel p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-xs font-label font-bold uppercase tracking-widest text-[var(--text-secondary)]">
                <Gauge className="h-3.5 w-3.5 text-[var(--f1-red)]" />
                Strategy Risk Matrix
              </h3>
              <button
                type="button"
                onClick={onCopyBrief}
                className="inline-flex items-center gap-1.5 border border-[var(--border)] bg-[var(--carbon-mid)] px-2.5 py-1 text-[10px] font-label font-black uppercase tracking-wider text-[var(--text-primary)] hover:border-[var(--f1-red)] transition-colors clip-para-sm"
              >
                <ClipboardCheck className="h-3 w-3" />
                {briefCopied ? "Copied" : "Copy Brief"}
              </button>
            </div>

            <div className="space-y-3">
              <ScoreRow
                label="Pit urgency"
                value={pitUrgency}
                tone={pitUrgency >= 70 ? "risk" : pitUrgency >= 45 ? "warn" : "safe"}
              />
              <ScoreRow
                label="SC probability (next 3 laps)"
                value={scProbability}
                tone={scProbability >= 55 ? "warn" : "safe"}
              />
              <ScoreRow
                label="Overtake risk"
                value={overtakeRisk}
                tone={overtakeRisk >= 60 ? "risk" : overtakeRisk >= 35 ? "warn" : "safe"}
              />
            </div>

            <div className="mt-4 border border-[var(--border)] bg-[var(--carbon-mid)] p-3">
              <p className="text-[10px] font-label font-black uppercase tracking-wider text-[var(--text-secondary)]">
                Execution Brief
              </p>
              <pre className="mt-2 whitespace-pre-wrap font-tele text-[11px] leading-relaxed text-[var(--text-primary)]">
                {executionBrief}
              </pre>
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => onInjectBriefToChat?.(executionBrief)}
                  className="pm-btn-primary px-3 py-1.5 text-[10px]"
                >
                  Push To Copilot
                </button>
              </div>
            </div>
          </div>

          <div className="pm-panel p-4">
            <h3 className="mb-3 flex items-center gap-2 text-xs font-label font-bold uppercase tracking-widest text-[var(--text-secondary)]">
              <ShieldCheck className="h-3.5 w-3.5 text-[var(--f1-red)]" />
              Strategy Execution Checklist
            </h3>

            <div className="mb-3 h-1.5 bg-[var(--carbon-light)]">
              <div className="h-full bg-[var(--f1-red)]" style={{ width: `${readinessPct}%` }} />
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => toggleChecklist("pitCrewReady")}
                className="flex w-full items-center justify-between border border-[var(--border)] bg-[var(--carbon-mid)] px-3 py-2 text-left hover:border-[var(--f1-red)] transition-colors"
              >
                <span className="font-tele text-[11px] font-semibold text-[var(--text-primary)] uppercase">
                  Pit crew ready at box
                </span>
                <span
                  className={`font-label text-[10px] font-black uppercase ${checklist.pitCrewReady ? "text-[var(--neon-green)]" : "text-[var(--text-secondary)]"}`}
                >
                  {checklist.pitCrewReady ? "Done" : "Pending"}
                </span>
              </button>
              <button
                type="button"
                onClick={() => toggleChecklist("tyreSetConfirmed")}
                className="flex w-full items-center justify-between border border-[var(--border)] bg-[var(--carbon-mid)] px-3 py-2 text-left hover:border-[var(--f1-red)] transition-colors"
              >
                <span className="font-tele text-[11px] font-semibold text-[var(--text-primary)] uppercase">
                  Target tyre set confirmed
                </span>
                <span
                  className={`font-label text-[10px] font-black uppercase ${checklist.tyreSetConfirmed ? "text-[var(--neon-green)]" : "text-[var(--text-secondary)]"}`}
                >
                  {checklist.tyreSetConfirmed ? "Done" : "Pending"}
                </span>
              </button>
              <button
                type="button"
                onClick={() => toggleChecklist("radioCallPrepared")}
                className="flex w-full items-center justify-between border border-[var(--border)] bg-[var(--carbon-mid)] px-3 py-2 text-left hover:border-[var(--f1-red)] transition-colors"
              >
                <span className="font-tele text-[11px] font-semibold text-[var(--text-primary)] uppercase">
                  Radio call script prepared
                </span>
                <span
                  className={`font-label text-[10px] font-black uppercase ${checklist.radioCallPrepared ? "text-[var(--neon-green)]" : "text-[var(--text-secondary)]"}`}
                >
                  {checklist.radioCallPrepared ? "Done" : "Pending"}
                </span>
              </button>
            </div>

            <div className="mt-3 flex items-start gap-2 border border-[var(--border)] bg-[var(--carbon-mid)] px-3 py-2">
              <TimerReset className="mt-0.5 h-3.5 w-3.5 text-[var(--f1-red)]" />
              <p className="font-tele text-[10px] leading-relaxed text-[var(--text-secondary)] uppercase">
                Ready state: {readinessCount}/3 checks complete.{" "}
                {readinessCount === 3
                  ? "Execution lane is clear."
                  : "Complete checklist before issuing final pit command."}
              </p>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onCommit}
                disabled={commitState.loading || !onCommitStrategy}
                className="pm-btn-primary flex-1 py-2 text-[10px]"
              >
                {commitState.loading ? "Committing..." : "Commit Strategy"}
              </button>
              <button
                type="button"
                onClick={() =>
                  setChecklist({
                    pitCrewReady: false,
                    tyreSetConfirmed: false,
                    radioCallPrepared: false,
                  })
                }
                className="h-9 border border-[var(--border)] bg-[var(--carbon-mid)] px-3 font-label text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors clip-para-sm"
              >
                Reset
              </button>
            </div>

            {commitState.message && (
              <p
                className={`mt-2 font-tele text-[10px] font-bold uppercase tracking-wider ${commitState.isError ? "text-[var(--f1-red)]" : "text-[var(--neon-green)]"}`}
              >
                {commitState.message}
              </p>
            )}
          </div>

          {reco.explanation && (
            <div className="pm-panel border-l-4 border-[var(--f1-red)] p-4">
              <h3 className="text-xs font-label font-bold uppercase tracking-widest text-[var(--text-secondary)]">
                Summary
              </h3>
              <p className="mt-2 font-tele text-xs leading-relaxed text-[var(--text-primary)]">
                {reco.explanation}
              </p>
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            <div className="pm-panel p-4">
              <h3 className="text-xs font-label font-bold uppercase tracking-widest text-[var(--text-secondary)]">
                Pipeline
              </h3>
              <div className="mt-3 space-y-3">
                {steps.length > 0 ? (
                  steps.map((step, idx) => (
                    <div key={idx} className="flex gap-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center bg-[var(--f1-red)] font-tele text-[10px] font-bold text-[var(--text-primary)]">
                        {idx + 1}
                      </span>
                      <p className="font-tele text-xs text-[var(--text-primary)]">{step}</p>
                    </div>
                  ))
                ) : (
                  <p className="font-tele text-xs text-[var(--text-secondary)]">
                    No pipeline steps returned.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="pm-panel p-4">
                <h3 className="text-xs font-label font-bold uppercase tracking-widest text-[var(--text-secondary)]">
                  Key Drivers
                </h3>
                {reasons.length > 0 ? (
                  <ul className="mt-3 space-y-2">
                    {reasons.map((reason, idx) => (
                      <li
                        key={idx}
                        className="flex gap-2 font-tele text-xs text-[var(--text-primary)]"
                      >
                        <span className="mt-1 h-2 w-2 bg-[var(--f1-red)]" />
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 font-tele text-xs text-[var(--text-secondary)]">
                    No structured reasons provided.
                  </p>
                )}
              </div>
              <div className="pm-panel p-4">
                <h3 className="text-xs font-label font-bold uppercase tracking-widest text-[var(--text-secondary)]">
                  Alternative
                </h3>
                <p className="mt-2 font-tele text-xs text-[var(--text-primary)]">
                  {reco.alternative}
                </p>
              </div>

              {(pitUrgency >= 70 || overtakeRisk >= 70) && (
                <div className="border border-[var(--f1-red)] bg-[var(--f1-red-dim)] p-4">
                  <h3 className="mb-2 flex items-center gap-2 font-label text-xs font-black uppercase tracking-widest text-[var(--f1-red)]">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Escalation Alert
                  </h3>
                  <p className="font-tele text-[10px] uppercase text-[var(--f1-red)]">
                    High urgency/risk detected. Keep alternative strategy armed for immediate
                    switch.
                  </p>
                </div>
              )}
            </div>
          </div>

          {evidence.length > 0 && (
            <div className="pm-panel p-4">
              <h3 className="text-xs font-label font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-3">
                Evidence
              </h3>
              <ul className="space-y-2">
                {evidence.map((item, idx) => (
                  <li
                    key={idx}
                    onClick={() => setSelectedEvidence(generateEvidenceDrilldown(item, idx))}
                    className="flex gap-3 text-sm text-[var(--text-secondary)] cursor-pointer group bg-[var(--carbon-mid)] p-3 border-l-2 border-[var(--f1-red)] hover:bg-[var(--carbon-light)] transition-all"
                  >
                    <span className="text-[var(--f1-red)] font-bold">»</span>
                    <span className="group-hover:text-[var(--text-primary)] transition-colors font-tele uppercase font-semibold text-[10px]">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 font-tele text-[10px] text-[var(--text-secondary)] uppercase">
                Click any evidence item to drill down into the telemetry data
              </p>
            </div>
          )}

          {assumptions.length > 0 && (
            <div className="border border-[var(--border)] bg-[var(--carbon-mid)] p-4">
              <h3 className="text-xs font-label font-bold uppercase tracking-widest text-[var(--text-secondary)]">
                Assumptions
              </h3>
              <ul className="mt-3 space-y-2">
                {assumptions.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex gap-2 font-tele text-[10px] uppercase text-[var(--text-primary)]"
                  >
                    <span className="text-[var(--f1-red)]">!</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <EvidenceDrilldownModal
        isOpen={selectedEvidence !== null}
        evidence={selectedEvidence ?? undefined}
        onClose={() => setSelectedEvidence(null)}
      />
    </>
  );
}
