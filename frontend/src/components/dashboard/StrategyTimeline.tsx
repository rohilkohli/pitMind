import { useEffect, useMemo, useState } from "react";
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
  const colorClass = tone === "safe" ? "bg-[#39B54A]" : tone === "warn" ? "bg-[#FFC906]" : "bg-f1-red";
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-wider text-f1-muted">{label}</span>
        <span className="font-mono text-[11px] text-f1-white">{value.toFixed(0)}%</span>
      </div>
      <div className="h-1.5 w-full bg-f1-border">
        <div className={`h-full ${colorClass}`} style={{ width: `${clampPercent(value)}%` }} />
      </div>
    </div>
  );
}

function confidenceTone(confidence: number) {
  if (confidence >= 70) return "text-[#39B54A]";
  if (confidence >= 45) return "text-[#FFC906]";
  return "text-f1-red";
}

export function StrategyTimeline({
  reco,
  strategyChecklistKey = "pitmind.strategy.checklist.default",
  onInjectBriefToChat,
  onCommitStrategy,
}: StrategyTimelineProps) {
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceDrilldown | null>(null);
  const [checklist, setChecklist] = useState<StrategyChecklistState>({
    pitCrewReady: false,
    tyreSetConfirmed: false,
    radioCallPrepared: false,
  });

  const [briefCopied, setBriefCopied] = useState(false);
  const [commitState, setCommitState] = useState<{ loading: boolean; message: string; isError: boolean }>({
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

  useEffect(() => {
    window.localStorage.setItem(strategyChecklistKey, JSON.stringify(checklist));
  }, [checklist, strategyChecklistKey]);

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
        className="flex h-full items-center justify-center p-8 text-center relative overflow-hidden bg-[#15151E]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(225,6,0,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(225,6,0,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}
      >
        <div className="relative z-10 flex flex-col items-center">
          <Lock className="w-10 h-10 text-[#38383F] mb-4" />
          <p className="text-[18px] font-display font-semibold text-[#67676D] uppercase tracking-widest leading-tight mb-2">
            Generate a strategy to <br/> unlock the reasoning trace
          </p>
          <p className="text-[13px] font-body text-[#38383F] max-w-[200px]">
            The viewer fills in with evidence, confidence, and alternate calls.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-2 text-left">
            <div className="border border-[#38383F] bg-[#1F1F27] px-3 py-2">
              <p className="text-[9px] font-black uppercase tracking-wider text-f1-muted">Awaiting</p>
              <p className="mt-1 text-[11px] font-bold text-f1-white">Recommendation</p>
            </div>
            <div className="border border-[#38383F] bg-[#1F1F27] px-3 py-2">
              <p className="text-[9px] font-black uppercase tracking-wider text-f1-muted">Awaiting</p>
              <p className="mt-1 text-[11px] font-bold text-f1-white">Risk Model</p>
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

  const readinessCount = Number(checklist.pitCrewReady) + Number(checklist.tyreSetConfirmed) + Number(checklist.radioCallPrepared);
  const readinessPct = (readinessCount / 3) * 100;

  // Mock drill-down data generator (in production, this would come from backend)
  const generateEvidenceDrilldown = (evidenceText: string, index: number): EvidenceDrilldown => {
    const lapRange: [number, number] = [Math.max(1, 20 - index * 5), Math.min(50, 25 - index * 5)];
    const dataPoints = Array.from({ length: lapRange[1] - lapRange[0] + 1 }, (_, i) => ({
      lap: lapRange[0] + i,
      value: Math.random() * 30 + 60 + (i % 2 ? -2 : 0),
    }));

    const trend = index % 3 === 0 ? 'improving' : index % 3 === 1 ? 'degrading' : 'stable';

    return {
      evidence: evidenceText,
      metric: 'Tyre Wear / Gap Trend / Fuel Delta',
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
      <div className="flex h-full flex-col border border-f1-border bg-f1-black">
        <div className="sticky top-0 z-10 border-b border-f1-border bg-f1-black px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-f1-white">AI Reasoning Trace</h2>
              <p className="mt-1 text-xs uppercase tracking-widest text-f1-muted">Model output with guardrails and structured evidence</p>
            </div>
            <span className="f1-badge f1-badge-soft text-xs">
              {confidence.toFixed(0)}%
            </span>
          </div>
        </div>
        
        <div className="space-y-5 overflow-y-auto px-4 py-4">
          <div className="f1-card border-l-4 border-f1-red p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-f1-muted">Recommendation</span>
                <h3 className="mt-2 text-xl font-display font-black uppercase text-f1-white">{reco.action}</h3>
              </div>
              <div className="border border-f1-border bg-f1-dark px-3 py-2 text-right">
                <div className="text-xs uppercase tracking-widest text-f1-muted">Compound</div>
                <div className="font-mono text-sm text-f1-white">{reco.suggested_compound}</div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-f1-muted">
              <div className="border border-f1-border bg-f1-dark px-3 py-2">
                <div className="uppercase tracking-widest">Pit</div>
                <div className="mt-1 font-bold text-f1-white">{String(reco.pit_this_lap)}</div>
              </div>
              <div className="border border-f1-border bg-f1-dark px-3 py-2">
                <div className="uppercase tracking-widest">Window</div>
                <div className="mt-1 font-mono text-f1-white">{windowStart}-{windowEnd}</div>
              </div>
              <div className="border border-f1-border bg-f1-dark px-3 py-2">
                <div className="uppercase tracking-widest">Confidence</div>
                <div className={`mt-1 font-mono ${confidenceTone(confidence)}`}>{confidence.toFixed(1)}%</div>
              </div>
            </div>

            <div className="mt-4 h-2 bg-f1-border">
              <div className="h-full bg-f1-red" style={{ width: `${confidence}%` }} />
            </div>
          </div>

          <div className="f1-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-f1-muted">
                <Gauge className="h-3.5 w-3.5 text-f1-red" />
                Strategy Risk Matrix
              </h3>
              <button
                type="button"
                onClick={onCopyBrief}
                className="inline-flex items-center gap-1.5 border border-f1-border bg-f1-dark px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-f1-white hover:border-f1-red"
              >
                <ClipboardCheck className="h-3 w-3" />
                {briefCopied ? "Copied" : "Copy Brief"}
              </button>
            </div>

            <div className="space-y-3">
              <ScoreRow label="Pit urgency" value={pitUrgency} tone={pitUrgency >= 70 ? "risk" : pitUrgency >= 45 ? "warn" : "safe"} />
              <ScoreRow label="SC probability (next 3 laps)" value={scProbability} tone={scProbability >= 55 ? "warn" : "safe"} />
              <ScoreRow label="Overtake risk" value={overtakeRisk} tone={overtakeRisk >= 60 ? "risk" : overtakeRisk >= 35 ? "warn" : "safe"} />
            </div>

            <div className="mt-4 border border-f1-border bg-f1-dark p-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-f1-muted">Execution Brief</p>
              <pre className="mt-2 whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-f1-secondary">{executionBrief}</pre>
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => onInjectBriefToChat?.(executionBrief)}
                  className="border border-f1-border bg-[#1A1A22] px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-f1-white hover:border-f1-red"
                >
                  Push To Copilot
                </button>
              </div>
            </div>
          </div>

          <div className="f1-card p-4">
            <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-f1-muted">
              <ShieldCheck className="h-3.5 w-3.5 text-f1-red" />
              Strategy Execution Checklist
            </h3>

            <div className="mb-3 h-1.5 bg-f1-border">
              <div className="h-full bg-f1-red" style={{ width: `${readinessPct}%` }} />
            </div>

            <div className="space-y-2">
              <button type="button" onClick={() => toggleChecklist("pitCrewReady")} className="flex w-full items-center justify-between border border-f1-border bg-f1-dark px-3 py-2 text-left">
                <span className="text-xs font-semibold text-f1-secondary">Pit crew ready at box</span>
                <span className={`text-[10px] font-black uppercase ${checklist.pitCrewReady ? "text-[#39B54A]" : "text-f1-muted"}`}>{checklist.pitCrewReady ? "Done" : "Pending"}</span>
              </button>
              <button type="button" onClick={() => toggleChecklist("tyreSetConfirmed")} className="flex w-full items-center justify-between border border-f1-border bg-f1-dark px-3 py-2 text-left">
                <span className="text-xs font-semibold text-f1-secondary">Target tyre set confirmed</span>
                <span className={`text-[10px] font-black uppercase ${checklist.tyreSetConfirmed ? "text-[#39B54A]" : "text-f1-muted"}`}>{checklist.tyreSetConfirmed ? "Done" : "Pending"}</span>
              </button>
              <button type="button" onClick={() => toggleChecklist("radioCallPrepared")} className="flex w-full items-center justify-between border border-f1-border bg-f1-dark px-3 py-2 text-left">
                <span className="text-xs font-semibold text-f1-secondary">Radio call script prepared</span>
                <span className={`text-[10px] font-black uppercase ${checklist.radioCallPrepared ? "text-[#39B54A]" : "text-f1-muted"}`}>{checklist.radioCallPrepared ? "Done" : "Pending"}</span>
              </button>
            </div>

            <div className="mt-3 flex items-start gap-2 border border-f1-border bg-[#1A1A22] px-3 py-2">
              <TimerReset className="mt-0.5 h-3.5 w-3.5 text-f1-red" />
              <p className="text-[11px] leading-relaxed text-f1-secondary">
                Ready state: {readinessCount}/3 checks complete. {readinessCount === 3 ? "Execution lane is clear." : "Complete checklist before issuing final pit command."}
              </p>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onCommit}
                disabled={commitState.loading || !onCommitStrategy}
                className="h-9 flex-1 border border-f1-red bg-f1-red/15 px-3 text-[10px] font-black uppercase tracking-[0.16em] text-f1-white hover:bg-f1-red/30 disabled:opacity-60"
              >
                {commitState.loading ? "Committing..." : "Commit Strategy"}
              </button>
              <button
                type="button"
                onClick={() => setChecklist({ pitCrewReady: false, tyreSetConfirmed: false, radioCallPrepared: false })}
                className="h-9 border border-f1-border bg-f1-dark px-3 text-[10px] font-black uppercase tracking-wider text-f1-muted hover:text-f1-white"
              >
                Reset
              </button>
            </div>

            {commitState.message && (
              <p className={`mt-2 text-[10px] font-bold uppercase tracking-wider ${commitState.isError ? "text-f1-red" : "text-[#39B54A]"}`}>
                {commitState.message}
              </p>
            )}
          </div>

          {reco.explanation && (
            <div className="f1-card border-l-4 border-f1-red p-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-f1-muted">Summary</h3>
              <p className="mt-2 text-sm leading-relaxed text-f1-secondary">{reco.explanation}</p>
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            <div className="f1-card p-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-f1-muted">Pipeline</h3>
              <div className="mt-3 space-y-3">
                {steps.length > 0 ? steps.map((step, idx) => (
                  <div key={idx} className="flex gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center bg-f1-red text-[10px] font-bold text-white">{idx + 1}</span>
                    <p className="text-sm text-f1-secondary">{step}</p>
                  </div>
                )) : <p className="text-sm text-f1-muted">No pipeline steps returned.</p>}
              </div>
            </div>

            <div className="space-y-3">
              <div className="f1-card p-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-f1-muted">Key Drivers</h3>
                {reasons.length > 0 ? (
                  <ul className="mt-3 space-y-2">
                    {reasons.map((reason, idx) => (
                      <li key={idx} className="flex gap-2 text-sm text-f1-secondary">
                        <span className="mt-1 h-2 w-2 bg-f1-red" />
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                ) : <p className="mt-2 text-sm text-f1-muted">No structured reasons provided.</p>}
              </div>
              <div className="f1-card p-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-f1-muted">Alternative</h3>
                <p className="mt-2 text-sm text-f1-secondary">{reco.alternative}</p>
              </div>

              {(pitUrgency >= 70 || overtakeRisk >= 70) && (
                <div className="border border-f1-red/30 bg-f1-red/10 p-4">
                  <h3 className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-f1-red">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Escalation Alert
                  </h3>
                  <p className="text-sm text-f1-secondary">
                    High urgency/risk detected. Keep alternative strategy armed for immediate switch.
                  </p>
                </div>
              )}
            </div>
          </div>

          {evidence.length > 0 && (
            <div className="f1-card p-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-f1-muted mb-3">Evidence</h3>
              <ul className="space-y-2">
                {evidence.map((item, idx) => (
                  <li
                    key={idx}
                    onClick={() => setSelectedEvidence(generateEvidenceDrilldown(item, idx))}
                    className="flex gap-3 text-sm text-[#C4C4C4] cursor-pointer group bg-[#2D2D35] p-3 border-l-2 border-f1-red hover:bg-[#38383F] transition-all"
                  >
                    <span className="text-f1-red font-bold">»</span>
                    <span className="group-hover:text-white transition-colors uppercase font-semibold text-[12px]">{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-f1-muted">Click any evidence item to drill down into the telemetry data</p>
            </div>
          )}

          {assumptions.length > 0 && (
            <div className="border border-f1-border bg-f1-dark p-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-f1-muted">Assumptions</h3>
              <ul className="mt-3 space-y-2">
                {assumptions.map((item, idx) => (
                  <li key={idx} className="flex gap-2 text-sm text-f1-secondary">
                    <span className="text-f1-red">!</span>
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
