import { useState } from "react";
import type { StrategyRecommendation } from "../../services/api";
import { EvidenceDrilldownModal, type EvidenceDrilldown } from "./EvidenceDrilldownModal";

export function StrategyTimeline({ reco }: { reco: StrategyRecommendation | null }) {
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceDrilldown | null>(null);

  if (!reco) {
    return (
      <div className="flex h-full items-center justify-center border border-dashed border-f1-border bg-f1-dark p-6 text-center">
        <div>
          <p className="text-sm font-bold text-f1-white uppercase tracking-widest">Generate a strategy to unlock the reasoning trace</p>
          <p className="mt-1 text-xs text-f1-muted uppercase tracking-widest">The viewer fills in with evidence, confidence, and alternate calls.</p>
        </div>
      </div>
    );
  }

  const steps = reco.pipeline_steps ?? [];
  const reasons = reco.structured_reasons ?? [];
  const evidence = reco.evidence ?? [];
  const assumptions = reco.assumptions ?? [];
  const confidence = Math.max(0, Math.min(100, reco.confidence));

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
                <div className="mt-1 font-mono text-f1-white">{reco.scores.recommended_window_laps[0]}-{reco.scores.recommended_window_laps[1]}</div>
              </div>
              <div className="border border-f1-border bg-f1-dark px-3 py-2">
                <div className="uppercase tracking-widest">Confidence</div>
                <div className="mt-1 font-mono text-f1-white">{confidence.toFixed(1)}%</div>
              </div>
            </div>

            <div className="mt-4 h-2 bg-f1-border">
              <div className="h-full bg-f1-red" style={{ width: `${confidence}%` }} />
            </div>
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
                    className="flex gap-2 text-sm text-f1-secondary cursor-pointer group"
                  >
                    <span className="text-f1-red">◆</span>
                    <span className="group-hover:text-f1-white transition-colors">{item}</span>
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
