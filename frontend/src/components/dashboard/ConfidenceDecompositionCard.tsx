import React from "react";
import { Card } from "../ui/card";
import type { ConfidenceDecomposition } from "../../services/api";

interface ConfidenceDecompositionCardProps {
  decomposition?: ConfidenceDecomposition | null;
  overallConfidence?: number;
}

export const ConfidenceDecompositionCard: React.FC<ConfidenceDecompositionCardProps> = ({
  decomposition,
  overallConfidence = 0,
}) => {
  const getConfidenceColor = (value: number): string => {
    if (value >= 70) return "var(--neon-green)";
    if (value >= 40) return "var(--amber)";
    return "var(--f1-red)";
  };

  if (!decomposition) {
    return (
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", height: "100%" }}>
        <div
          style={{
            background: "var(--carbon-light)",
            border: "1px solid var(--border)",
            padding: "16px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "180px",
            flex: 1,
          }}
        >
          <p
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              color: "var(--text-secondary)",
              margin: 0,
            }}
          >
            Run strategy analysis to see confidence breakdown
          </p>
        </div>
      </div>
    );
  }

  const metrics = [
    { label: "Data Quality", value: decomposition.data_quality },
    { label: "Model Certainty", value: decomposition.model_certainty },
    { label: "Stability", value: decomposition.stability },
  ];

  return (
    <Card
      style={{
        background: "transparent",
        boxShadow: "none",
        position: "relative",
      }}
    >
      <div style={{ padding: "16px" }}>
        {/* Overall */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 6,
            }}
          >
            <span
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--text-secondary)",
              }}
            >
              Overall Confidence
            </span>
            <span
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: 18,
                fontWeight: 700,
                color: getConfidenceColor(overallConfidence),
                lineHeight: 1,
              }}
            >
              {overallConfidence.toFixed(0)}%
            </span>
          </div>
          <div
            style={{
              width: "100%",
              height: 3,
              background: "var(--border)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${Math.min(overallConfidence, 100)}%`,
                background: getConfidenceColor(overallConfidence),
                transition: "width 0.4s ease",
                boxShadow: `0 0 6px ${getConfidenceColor(overallConfidence)}`,
              }}
            />
          </div>
        </div>

        {/* Breakdown */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {metrics.map((metric) => (
            <div
              key={metric.label}
              style={{
                borderLeft: "2px solid var(--f1-red)",
                paddingLeft: 10,
              }}
            >
              <div
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "var(--text-secondary)",
                  marginBottom: 4,
                }}
              >
                {metric.label}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    fontFamily: "'Orbitron', sans-serif",
                    fontSize: 14,
                    fontWeight: 700,
                    color: getConfidenceColor(metric.value),
                    minWidth: 36,
                  }}
                >
                  {metric.value.toFixed(0)}%
                </span>
                <div
                  style={{
                    flex: 1,
                    height: 2,
                    background: "var(--border)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${metric.value}%`,
                      background: getConfidenceColor(metric.value),
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Assessment */}
        <div
          style={{
            marginTop: 14,
            padding: "10px 12px",
            background: "var(--carbon-light)",
            borderLeft: "2px solid var(--f1-red)",
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
            Assessment
          </div>
          <p
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10,
              color: "var(--text-secondary)",
              lineHeight: 1.5,
            }}
          >
            {overallConfidence >= 70 ? (
              <>
                <span style={{ color: "var(--neon-green)", fontWeight: 600 }}>HIGH CONFIDENCE</span>{" "}
                — Strategy well-supported. Safe to execute immediately.
              </>
            ) : overallConfidence >= 40 ? (
              <>
                <span style={{ color: "var(--amber)", fontWeight: 600 }}>MODERATE CONFIDENCE</span>{" "}
                — Good strategy. Consider alternatives.
              </>
            ) : (
              <>
                <span style={{ color: "var(--f1-red)", fontWeight: 600 }}>LOW CONFIDENCE</span> —
                High uncertainty. Collect more telemetry.
              </>
            )}
          </p>
        </div>
      </div>
    </Card>
  );
};
