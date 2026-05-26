import React, { useState } from "react";
import { ArrowRight, TrendingUp, Zap, Clock } from "lucide-react";

export interface PitScenario {
  id: string;
  label: string;
  description: string;
  action: "stay_out" | "pit_now" | "pit_plus_2";
  predictedPosition: number;
  predictedGap: number;
  predictedLapTime: number;
  confidence: number;
  pros: string[];
  cons: string[];
  timeline: Array<{
    lap: number;
    event: string;
    delta: string;
  }>;
}

interface BranchingSimulatorProps {
  currentLap?: number;
  currentPosition?: number;
  currentGap?: number;
  onSelectScenario?: (scenario: PitScenario) => void;
}

// Mock pit scenarios
const MOCK_SCENARIOS: PitScenario[] = [
  {
    id: "stay_out",
    label: "Stay Out",
    description: "Continue without pit stop",
    action: "stay_out",
    predictedPosition: 1,
    predictedGap: 2.4,
    predictedLapTime: 79.2,
    confidence: 0.72,
    pros: [
      "Maintain track position",
      "Avoid pit loss (22s)",
      "Undercut risk lower",
      "Fuel margin increases",
    ],
    cons: [
      "Tyre wear accelerates",
      "Gap to P2 widens gradually",
      "Vulnerable to SC bunching",
      "Pace drops ~0.3s/lap after 10 laps",
    ],
    timeline: [
      { lap: 28, event: "Continue current strategy", delta: "+0.0s" },
      { lap: 32, event: "Tyre temp stabilizes", delta: "+0.2s" },
      { lap: 36, event: "Tyre wear becomes critical", delta: "+0.5s" },
      { lap: 40, event: "Pace degradation starts", delta: "+1.2s" },
    ],
  },
  {
    id: "pit_now",
    label: "Pit This Lap",
    description: "Box immediately for tyre change",
    action: "pit_now",
    predictedPosition: 2,
    predictedGap: -1.8,
    predictedLapTime: 78.5,
    confidence: 0.85,
    pros: [
      "Fresh tyres immediately",
      "Best pace resumption (78.5s)",
      "Predictable tire degradation curve",
      "SC insurance: new compound ready",
    ],
    cons: [
      "Lose track position to P2 (drop 1 place)",
      "Pit loss: ~22 seconds",
      "Traffic risk on pit entry",
      "Gap to leader widens 3.2s initially",
    ],
    timeline: [
      { lap: 28, event: "Pit entry/exit", delta: "-22.0s" },
      { lap: 29, event: "Soft tyre on-lap recovery", delta: "+2.1s" },
      { lap: 33, event: "Pace reaches baseline", delta: "-0.8s" },
      { lap: 40, event: "Stable race pace", delta: "-0.4s" },
    ],
  },
  {
    id: "pit_plus_2",
    label: "Pit Lap 30",
    description: "Wait 2 more laps, then box",
    action: "pit_plus_2",
    predictedPosition: 1,
    predictedGap: 0.6,
    predictedLapTime: 78.8,
    confidence: 0.68,
    pros: [
      "Undercut leader (if they pit lap 32)",
      "Avoid immediate traffic",
      "Extend current tyre life 2 laps",
      "Fresh compound on fresh fuel",
    ],
    cons: [
      "Tyre deg severe for 2 laps (~0.8s pace loss)",
      "P2 likely pits sooner, benefits from clear pit lane",
      "Risk gap closure to leader",
      "SC probability 8% in next 2 laps",
    ],
    timeline: [
      { lap: 28, event: "Manage tyre temp", delta: "+0.3s" },
      { lap: 29, event: "Fuel consumption high", delta: "+0.5s" },
      { lap: 30, event: "Pit entry/exit", delta: "-21.8s" },
      { lap: 35, event: "Undercut advantage if leader in box", delta: "-1.2s" },
    ],
  },
];

export const BranchingSimulator: React.FC<BranchingSimulatorProps> = ({
  currentLap = 27,
  currentPosition = 1,
  currentGap = 0.0,
  onSelectScenario,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedScenario = MOCK_SCENARIOS.find((s) => s.id === selectedId);

  return (
      <div className="space-y-6">
        {/* Scenario Comparison Cards */}
        <div className="flex flex-col md:flex-row items-stretch gap-4">
          {MOCK_SCENARIOS.map((scenario) => (
            <div
            key={scenario.id}
            onClick={() => {
              setSelectedId(scenario.id);
              onSelectScenario?.(scenario);
            }}
              className={`cursor-pointer pm-panel pm-glass-card border border-[var(--border)] min-w-[140px] p-4 transition-all flex flex-col flex-1 ${
                selectedId === scenario.id
                  ? "border-[var(--f1-red)]"
                  : "hover:border-[var(--f1-red)]"
              }`}
            >
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <h3 className="font-label text-sm text-[var(--text-primary)]">{scenario.label}</h3>
                <p className="font-tele text-[10px] text-[var(--text-secondary)] mt-1" style={{ minHeight: "48px", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                  {scenario.description}
                </p>
              </div>
              <div
                className={`pm-badge-ai`}
                style={{
                  background:
                    scenario.confidence >= 0.8
                      ? "var(--neon-green-dim)"
                      : scenario.confidence >= 0.65
                        ? "var(--amber-dim)"
                        : "var(--f1-red-dim)",
                  color:
                    scenario.confidence >= 0.8
                      ? "var(--neon-green)"
                      : scenario.confidence >= 0.65
                        ? "var(--amber)"
                        : "var(--f1-red)",
                  border: `1px solid ${scenario.confidence >= 0.8 ? "var(--neon-green)" : scenario.confidence >= 0.65 ? "var(--amber)" : "var(--f1-red)"}`,
                  minWidth: "44px",
                  textAlign: "center",
                  padding: "2px 8px",
                  borderRadius: "999px",
                  fontWeight: 700,
                  fontSize: "13px",
                  flexShrink: 0
                }}
              >
                {(scenario.confidence * 100).toFixed(0)}%
              </div>
            </div>

            {/* Outcome metrics */}
            <div className="space-y-2 mb-4 mt-auto flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-label tracking-widest text-[var(--text-secondary)] uppercase">
                  Predicted Pos
                </span>
                <span className="font-race text-[var(--text-primary)]">
                  P{scenario.predictedPosition}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-label tracking-widest text-[var(--text-secondary)] uppercase">
                  Gap
                </span>
                <span
                  className={`font-race ${scenario.predictedGap > 0 ? "text-[var(--f1-red)]" : "text-[var(--neon-green)]"}`}
                >
                  {scenario.predictedGap > 0 ? "+" : ""}
                  {scenario.predictedGap.toFixed(1)}s
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-label tracking-widest text-[var(--text-secondary)] uppercase">
                  Lap Time
                </span>
                <span className="font-tele text-[var(--text-primary)]">
                  {scenario.predictedLapTime.toFixed(1)}s
                </span>
              </div>
            </div>

            {/* Selection indicator */}
            {selectedId === scenario.id && (
              <div className="pt-3 border-t border-white/10">
                <p className="text-xs text-f1-red font-semibold">✓ Selected scenario</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Detailed scenario view */}
      {selectedScenario && (
        <div className="pm-panel pm-glass-card border border-[var(--border)] p-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Left: Pros & Cons */}
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Advantages
                </h4>
                <ul className="space-y-2">
                  {selectedScenario.pros.map((pro, idx) => (
                    <li key={idx} className="flex gap-2 text-xs text-white">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                      <span>{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-red-400" />
                  Risks
                </h4>
                <ul className="space-y-2">
                  {selectedScenario.cons.map((con, idx) => (
                    <li key={idx} className="flex gap-2 text-xs text-white">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-400 flex-shrink-0" />
                      <span>{con}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right: Timeline */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-f1-red" />
                Predicted Timeline
              </h4>
              <div className="space-y-3">
                {selectedScenario.timeline.map((entry, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border border-white/10 bg-black/20 text-xs text-white"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold">Lap {entry.lap}</span>
                      <span
                        className={`font-mono ${entry.delta.includes("+") ? "text-red-400" : "text-emerald-400"}`}
                      >
                        {entry.delta}
                      </span>
                    </div>
                    <p className="text-f1-muted">{entry.event}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action button */}
          <div className="mt-6 pt-6" style={{ borderTop: "1px solid var(--border)" }}>
            <button className="pm-btn-primary w-full flex items-center justify-center gap-2">
              <span>Execute {selectedScenario.label} Strategy</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Info panel */}
      <div
        className="pm-panel p-4 bg-[var(--carbon-mid)]"
        style={{ border: "1px solid var(--border)" }}
      >
        <p className="font-tele text-[10px] text-[var(--text-secondary)]">
          <span className="font-label tracking-widest text-[var(--text-primary)] uppercase mr-2">
            Current State:
          </span>{" "}
          Lap {currentLap}, P{currentPosition}, Gap {currentGap > 0 ? "+" : ""}
          {currentGap.toFixed(1)}s
        </p>
        <p className="text-xs text-f1-muted mt-2">
          Click a scenario card to view pros/cons and predicted timeline. Compare outcomes before
          committing to a pit strategy.
        </p>
      </div>
    </div>
  );
};
