import { useState } from "react";
import type { StrategyRecommendation } from "../../services/api";
import { EvidenceDrilldownModal, type EvidenceDrilldown } from "./EvidenceDrilldownModal";

export function StrategyTimeline({ reco }: { reco: StrategyRecommendation | null }) {
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceDrilldown | null>(null);

  if (!reco) {
    return (
      <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/5 p-6 text-center">
        <div>
          <p className="text-sm font-medium text-pit-fg">Generate a strategy to unlock the reasoning trace</p>
          <p className="mt-1 text-xs text-pit-muted">The viewer fills in with evidence, confidence, and alternate calls.</p>
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
      <div className="flex h-full flex-col rounded-3xl border border-white/10 bg-white/5 shadow-[0_12px_32px_rgba(0,0,0,0.28)] backdrop-blur">
        <div className="sticky top-0 z-10 rounded-t-3xl border-b border-white/8 bg-carbon/80 px-4 py-4 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.32em] text-pit-muted">AI Reasoning Trace</h2>
              <p className="mt-1 text-xs text-pit-muted">Model output with guardrails and structured evidence</p>
            </div>
            <span className="rounded-full border border-pit-accent/25 bg-pit-accent/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-pit-accent">
              {confidence.toFixed(0)}%
            </span>
          </div>
        </div>
        
        <div className="space-y-5 overflow-y-auto px-4 py-4">
          <div className="rounded-3xl border border-white/10 bg-[linear-gradient(135deg,rgba(225,6,0,0.18),rgba(20,184,166,0.10))] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-pit-muted">Recommendation</span>
                <h3 className="mt-2 text-xl font-semibold text-pit-fg">{reco.action}</h3>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-right">
                <div className="text-[10px] uppercase tracking-[0.28em] text-pit-muted">Compound</div>
                <div className="font-mono text-sm text-pit-fg">{reco.suggested_compound}</div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-pit-muted">
              <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
                <div className="uppercase tracking-[0.24em]">Pit</div>
                <div className="mt-1 font-semibold text-pit-fg">{String(reco.pit_this_lap)}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
                <div className="uppercase tracking-[0.24em]">Window</div>
                <div className="mt-1 font-mono text-pit-fg">{reco.scores.recommended_window_laps[0]}-{reco.scores.recommended_window_laps[1]}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
                <div className="uppercase tracking-[0.24em]">Confidence</div>
                <div className="mt-1 font-mono text-pit-fg">{confidence.toFixed(1)}%</div>
              </div>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/30">
              <div className="h-full rounded-full bg-gradient-to-r from-pit-accent via-orange-400 to-amber-300" style={{ width: `${confidence}%` }} />
            </div>
          </div>

          {reco.explanation && (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.28em] text-pit-muted">Summary</h3>
              <p className="mt-2 text-sm leading-relaxed text-pit-fg">{reco.explanation}</p>
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.28em] text-pit-muted">Pipeline</h3>
              <div className="mt-3 space-y-3">
                {steps.length > 0 ? steps.map((step, idx) => (
                  <div key={idx} className="flex gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pit-accent/15 text-[10px] font-bold text-pit-accent">{idx + 1}</span>
                    <p className="text-sm text-pit-fg">{step}</p>
                  </div>
                )) : <p className="text-sm text-pit-muted">No pipeline steps returned.</p>}
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.28em] text-pit-muted">Key Drivers</h3>
                {reasons.length > 0 ? (
                  <ul className="mt-3 space-y-2">
                    {reasons.map((reason, idx) => (
                      <li key={idx} className="flex gap-2 text-sm text-pit-fg">
                        <span className="mt-1 h-2 w-2 rounded-full bg-pit-accent" />
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                ) : <p className="mt-2 text-sm text-pit-muted">No structured reasons provided.</p>}
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.28em] text-pit-muted">Alternative</h3>
                <p className="mt-2 text-sm text-pit-fg">{reco.alternative}</p>
              </div>
            </div>
          </div>

          {evidence.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.28em] text-pit-muted mb-3">Evidence</h3>
              <ul className="space-y-2">
                {evidence.map((item, idx) => (
                  <li
                    key={idx}
                    onClick={() => setSelectedEvidence(generateEvidenceDrilldown(item, idx))}
                    className="flex gap-2 text-sm text-pit-fg cursor-pointer group"
                  >
                    <span className="text-teal-300 group-hover:text-teal-100">◆</span>
                    <span className="group-hover:text-pit-accent transition-colors">{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-pit-muted">💡 Click any evidence item to drill down into the telemetry data</p>
            </div>
          )}

          {assumptions.length > 0 && (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-200">Assumptions</h3>
              <ul className="mt-3 space-y-2">
                {assumptions.map((item, idx) => (
                  <li key={idx} className="flex gap-2 text-sm text-pit-fg/90">
                    <span className="text-amber-300">⚠</span>
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
