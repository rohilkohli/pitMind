import React, { useState } from "react";
import { ArrowRight, TrendingUp, Zap, Clock, CheckCircle } from "lucide-react";

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

function confidenceColor(c: number) {
  if (c >= 0.8)
    return { bg: "rgba(57,255,20,0.08)", border: "var(--neon-green)", text: "var(--neon-green)" };
  if (c >= 0.65)
    return { bg: "rgba(255,152,0,0.08)", border: "var(--amber)", text: "var(--amber)" };
  return { bg: "rgba(225,6,0,0.08)", border: "var(--f1-red)", text: "var(--f1-red)" };
}

export const BranchingSimulator: React.FC<BranchingSimulatorProps> = ({
  currentLap = 27,
  currentPosition = 1,
  currentGap = 0.0,
  onSelectScenario,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedScenario = MOCK_SCENARIOS.find((s) => s.id === selectedId);

  return (
    <div className="space-y-4" style={{ padding: "16px 16px 8px" }}>
      {/* Scenario Cards */}
      <div className="flex flex-col md:flex-row items-stretch gap-3">
        {MOCK_SCENARIOS.map((scenario) => {
          const cc = confidenceColor(scenario.confidence);
          const isSelected = selectedId === scenario.id;
          return (
            <div
              key={scenario.id}
              onClick={() => {
                setSelectedId(scenario.id);
                onSelectScenario?.(scenario);
              }}
              style={{
                flex: 1,
                minWidth: 0,
                cursor: "pointer",
                borderRadius: 0,
                border: `1px solid ${isSelected ? "var(--f1-red)" : "rgba(255,255,255,0.08)"}`,
                background: isSelected
                  ? "linear-gradient(135deg, rgba(225,6,0,0.12) 0%, rgba(18,18,20,0.92) 100%)"
                  : "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(10,10,11,0.88) 100%)",
                backdropFilter: "blur(16px) saturate(1.4)",
                WebkitBackdropFilter: "blur(16px) saturate(1.4)",
                boxShadow: isSelected
                  ? "0 0 0 1px var(--f1-red), inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 32px rgba(225,6,0,0.18)"
                  : "inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 16px rgba(0,0,0,0.4)",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
                position: "relative",
                overflow: "hidden",
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(225,6,0,0.45)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow =
                    "inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 24px rgba(0,0,0,0.5)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.08)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow =
                    "inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 16px rgba(0,0,0,0.4)";
                }
              }}
            >
              {/* Subtle top highlight line */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 1,
                  background: isSelected
                    ? "linear-gradient(90deg, transparent, var(--f1-red), transparent)"
                    : "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
                }}
              />

              {/* Header row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: "'Orbitron', sans-serif",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {scenario.label}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: 10,
                      color: "var(--text-secondary)",
                      marginTop: 4,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {scenario.description}
                  </div>
                </div>
                <div
                  style={{
                    padding: "3px 8px",
                    borderRadius: 2,
                    background: cc.bg,
                    border: `1px solid ${cc.border}`,
                    color: cc.text,
                    fontFamily: "'Orbitron', sans-serif",
                    fontSize: 12,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {(scenario.confidence * 100).toFixed(0)}%
                </div>
              </div>

              {/* Metrics */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  { label: "Pred. Pos", value: `P${scenario.predictedPosition}`, colored: false },
                  {
                    label: "Gap",
                    value: `${scenario.predictedGap > 0 ? "+" : ""}${scenario.predictedGap.toFixed(1)}s`,
                    colored: true,
                    positive: scenario.predictedGap <= 0,
                  },
                  {
                    label: "Lap Time",
                    value: `${scenario.predictedLapTime.toFixed(1)}s`,
                    colored: false,
                  },
                ].map((m) => (
                  <div
                    key={m.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontSize: 10,
                        color: "var(--text-secondary)",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                      }}
                    >
                      {m.label}
                    </span>
                    <span
                      style={{
                        fontFamily: "'Orbitron', sans-serif",
                        fontSize: 11,
                        fontWeight: 700,
                        color: m.colored
                          ? m.positive
                            ? "var(--neon-green)"
                            : "var(--f1-red)"
                          : "var(--text-primary)",
                      }}
                    >
                      {m.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Selected indicator */}
              {isSelected && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    paddingTop: 8,
                    borderTop: "1px solid rgba(225,6,0,0.2)",
                  }}
                >
                  <CheckCircle size={12} color="var(--f1-red)" />
                  <span
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: 10,
                      color: "var(--f1-red)",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                    }}
                  >
                    Selected
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Detailed scenario view */}
      {selectedScenario && (
        <div
          style={{
            border: "1px solid rgba(255,255,255,0.08)",
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(10,10,11,0.92) 100%)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            padding: "20px",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 8px 32px rgba(0,0,0,0.5)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 1,
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)",
            }}
          />
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
                    style={{
                      padding: "10px 12px",
                      border: "1px solid rgba(255,255,255,0.07)",
                      background: "rgba(0,0,0,0.25)",
                      backdropFilter: "blur(8px)",
                    }}
                    className="text-xs text-white"
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
          <div className="mt-6 pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <button className="pm-btn-primary w-full flex items-center justify-center gap-2">
              <span>Execute {selectedScenario.label} Strategy</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Info panel */}
      <div
        style={{
          padding: "10px 14px",
          border: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(10,10,11,0.6)",
        }}
      >
        <p className="font-tele text-[10px] text-[var(--text-secondary)]">
          <span className="font-label tracking-widest text-[var(--text-primary)] uppercase mr-2">
            Current State:
          </span>{" "}
          Lap {currentLap}, P{currentPosition}, Gap {currentGap > 0 ? "+" : ""}
          {currentGap.toFixed(1)}s
        </p>
        <p className="text-xs text-f1-muted mt-1">
          Click a scenario card to view pros/cons and predicted timeline.
        </p>
      </div>
    </div>
  );
};
