import React, { useState } from "react";
import { Download, CheckCircle } from "lucide-react";

export interface StrategyDecision {
  id: string;
  lap: number;
  timestamp: string;
  action: string;
  confidence: number;
  reasoning: string;
  annotation?: string;
  approved: boolean;
  approvedBy?: string;
  outcome?: {
    resultPosition: number;
    resultGap: number;
    notes: string;
  };
}

interface DecisionLogProps {
  decisions?: StrategyDecision[];
  onAddAnnotation?: (decisionId: string, annotation: string) => void;
  onExportSession?: () => void;
  showHeader?: boolean;
}

const MOCK_DECISIONS: StrategyDecision[] = [
  {
    id: "1",
    lap: 12,
    timestamp: "00:28:45",
    action: "Pit For Fresh Softs",
    confidence: 0.91,
    reasoning: "Tyre wear accelerating. Pit window optimal. Leader not yet committed.",
    annotation: "Clean pit execution, 2.1s stop",
    approved: true,
    approvedBy: "Engineer Lead",
    outcome: { resultPosition: 2, resultGap: 1.2, notes: "Undercut attempt, competitor matched" },
  },
  {
    id: "2",
    lap: 23,
    timestamp: "00:54:12",
    action: "Hold Position",
    confidence: 0.72,
    reasoning: "P2 tyre gap narrowing. Wait for their pit signal before committing.",
    annotation: "Good call - P2 pit 2 laps later",
    approved: true,
    approvedBy: "Strategist",
    outcome: { resultPosition: 1, resultGap: -0.8, notes: "Gained 2 positions through patience" },
  },
  {
    id: "3",
    lap: 35,
    timestamp: "01:22:33",
    action: "Switch To Conservative",
    confidence: 0.65,
    reasoning: "Tyre management critical. Low confidence in final stint durability.",
    annotation: "Borderline call - could have pushed more",
    approved: true,
    approvedBy: "Engineer Lead",
  },
  {
    id: "4",
    lap: 41,
    timestamp: "01:45:18",
    action: "Final Push — Soft",
    confidence: 0.79,
    reasoning: "SC deployed lap 38. Fresh softs now optimal for DRS battles.",
    approved: false,
  },
];

export const DecisionLog: React.FC<DecisionLogProps> = ({
  decisions = MOCK_DECISIONS,
  onAddAnnotation: _onAddAnnotation,
  onExportSession,
  showHeader = true,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getConfClass = (conf: number): string => {
    const pct = conf * 100;
    if (pct >= 80) return "pm-conf-high";
    if (pct >= 60) return "pm-conf-mid";
    return "pm-conf-low";
  };

  const getCallLabel = (conf: number): string => {
    const pct = conf * 100;
    if (pct >= 80) return "OPTIMAL CALL";
    if (pct >= 60) return "BORDERLINE CALL";
    return "RISKY CALL";
  };

  const getCardClass = (conf: number): string => {
    const pct = conf * 100;
    if (pct >= 80) return "pm-strategy-card optimal";
    if (pct >= 60) return "pm-strategy-card borderline";
    return "pm-strategy-card";
  };

  const avgConfidence =
    decisions.length > 0
      ? (decisions.reduce((sum, d) => sum + d.confidence, 0) / decisions.length) * 100
      : 0;

  return (
    <div
      style={{
        border: "none",
        background: "transparent",
        borderRadius: 0,
        boxShadow: "none",
        padding: 0,
      }}
    >
      <div>
        {/* Header */}
        {showHeader && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <div className="pm-panel-title">Decision Log</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10,
                  color: "var(--text-secondary)",
                }}
              >
                {decisions.length} CALLS · {decisions.filter((d) => d.approved).length} APPROVED
              </span>
              <button
                onClick={onExportSession}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "5px 12px",
                  border: "1px solid var(--border)",
                  background: "var(--carbon-light)",
                  color: "var(--text-secondary)",
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  clipPath: "polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--border-active)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                }}
              >
                <Download style={{ width: 10, height: 10 }} />
                EXPORT
              </button>
            </div>
          </div>
        )}

        {/* Cards */}
        {decisions.map((decision) => (
          <div
            key={decision.id}
            className={getCardClass(decision.confidence)}
            onClick={() => setExpandedId(expandedId === decision.id ? null : decision.id)}
            style={{ borderRadius: 0 }}
          >
            {/* Card header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 6,
              }}
            >
              <div className="pm-strategy-action">{decision.action}</div>
              <div
                className={`pm-confidence-badge ${getConfClass(decision.confidence)}`}
                style={{ borderRadius: 0 }}
              >
                {(decision.confidence * 100).toFixed(0)}%
              </div>
            </div>

            {/* Call label + lap */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 6,
              }}
            >
              <span
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color:
                    decision.confidence >= 0.8
                      ? "var(--neon-green)"
                      : decision.confidence >= 0.6
                        ? "var(--amber)"
                        : "var(--f1-red)",
                }}
              >
                {getCallLabel(decision.confidence)}
              </span>
              <span
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10,
                  color: "var(--text-secondary)",
                }}
              >
                LAP {decision.lap} · {decision.timestamp}
              </span>
            </div>

            {/* Reasoning */}
            <div className="pm-strategy-text">{decision.reasoning}</div>

            {/* Meta */}
            <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
              {decision.approved && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "var(--neon-green)",
                  }}
                >
                  <CheckCircle style={{ width: 10, height: 10 }} />
                  {decision.approvedBy ?? "APPROVED"}
                </div>
              )}
            </div>

            {/* Expanded details */}
            {expandedId === decision.id && decision.outcome && (
              <div
                style={{
                  marginTop: 10,
                  paddingTop: 10,
                  borderTop: "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "var(--text-secondary)",
                    marginBottom: 4,
                  }}
                >
                  Outcome
                </div>
                <div className="pm-strategy-text">
                  P{decision.outcome.resultPosition} · Gap:{" "}
                  {decision.outcome.resultGap > 0 ? "+" : ""}
                  {decision.outcome.resultGap}s<br />
                  {decision.outcome.notes}
                </div>
                {decision.annotation && (
                  <div
                    style={{
                      marginTop: 6,
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 10,
                      color: "var(--text-secondary)",
                      fontStyle: "italic",
                    }}
                  >
                    ※ {decision.annotation}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Footer stats */}
        <div
          style={{
            marginTop: 16,
            paddingTop: 12,
            borderTop: "1px solid var(--border)",
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 0,
          }}
        >
          {[
            { val: decisions.length, label: "Total Calls", color: "var(--text-primary)" },
            {
              val: decisions.filter((d) => d.approved).length,
              label: "Approved",
              color: "var(--neon-green)",
            },
            {
              val: `${avgConfidence.toFixed(0)}%`,
              label: "Avg Confidence",
              color: "var(--text-primary)",
            },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: "center", padding: "0 8px" }}>
              <div
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: 22,
                  fontWeight: 700,
                  color: stat.color,
                  lineHeight: 1,
                  marginBottom: 4,
                }}
              >
                {stat.val}
              </div>
              <div
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "var(--text-secondary)",
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
