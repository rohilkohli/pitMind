import type { StrategyRecommendation } from "../../services/api";

export function StrategyTimeline({ reco }: { reco: StrategyRecommendation | null }) {
  if (!reco) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-sm text-pit-muted">Run strategy engine to see AI reasoning timeline.</p>
      </div>
    );
  }

  const steps = reco.pipeline_steps ?? [];
  const reasons = reco.structured_reasons ?? [];
  const evidence = reco.evidence ?? [];
  const assumptions = reco.assumptions ?? [];

  return (
    <div className="flex flex-col">
      <div className="sticky top-0 bg-carbon pb-2 pt-4">
        <h2 className="px-4 text-[11px] font-semibold uppercase tracking-widest text-pit-muted">AI Reasoning Trace</h2>
      </div>
      
      <div className="p-4 space-y-6 overflow-y-auto">
        {/* Recommendation Header */}
        <div className="rounded-lg border border-pit-accent bg-pit-accent/10 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-pit-accent">Recommendation</span>
            <span className="rounded bg-pit-accent px-2 py-0.5 text-xs font-bold text-white">{reco.action}</span>
          </div>
          <p className="text-sm text-pit-fg mb-1">
            Pit this lap: <span className="font-mono text-pit-accent">{String(reco.pit_this_lap)}</span>
          </p>
          <p className="text-sm text-pit-fg mb-1">
            Compound: <span className="font-mono text-pit-accent">{reco.suggested_compound}</span>
          </p>
          <p className="text-sm text-pit-fg">
            Confidence: <span className="font-mono text-pit-accent">{reco.confidence.toFixed(1)}%</span>
          </p>
        </div>

        {/* Explanation */}
        {reco.explanation && (
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-pit-muted mb-2">Summary</h3>
            <p className="text-sm text-pit-fg leading-relaxed">{reco.explanation}</p>
          </div>
        )}

        {/* Timeline Steps */}
        <div className="relative border-l border-pit-stroke pl-4 ml-2">
          {steps.map((step, idx) => (
            <div key={idx} className="mb-6 relative">
              <span className="absolute -left-[21px] top-1 flex h-2.5 w-2.5 rounded-full bg-pit-accent ring-4 ring-carbon" />
              <p className="text-xs uppercase tracking-wide text-pit-muted mb-1">Step {idx + 1}</p>
              <p className="text-sm text-pit-fg">{step}</p>
            </div>
          ))}
        </div>

        {/* Structured Reasons */}
        {reasons.length > 0 && (
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-pit-muted mb-2">Key Drivers</h3>
            <ul className="space-y-2">
              {reasons.map((reason, idx) => (
                <li key={idx} className="flex gap-2 text-sm text-pit-fg">
                  <span className="text-pit-accent">▹</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Evidence */}
        {evidence.length > 0 && (
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-pit-muted mb-2">Evidence</h3>
            <ul className="space-y-2">
              {evidence.map((item, idx) => (
                <li key={idx} className="flex gap-2 text-sm text-pit-fg">
                  <span className="text-teal-400">◆</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Assumptions */}
        {assumptions.length > 0 && (
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-pit-muted mb-2">Assumptions</h3>
            <ul className="space-y-2">
              {assumptions.map((item, idx) => (
                <li key={idx} className="flex gap-2 text-sm text-pit-muted">
                  <span className="text-yellow-500">⚠</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Alternative */}
        {reco.alternative && (
          <div className="rounded-lg border border-pit-stroke bg-black/30 p-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-pit-muted mb-1">Alternative Strategy</h3>
            <p className="text-sm text-pit-fg">{reco.alternative}</p>
          </div>
        )}
      </div>
    </div>
  );
}
