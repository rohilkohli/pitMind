import React from "react";
import { X, BarChart3, TrendingDown, AlertCircle, TrendingUp, Minus } from "lucide-react";

export interface EvidenceDrilldown {
  evidence: string;
  metric: string;
  lapRange: [number, number];
  dataPoints: { lap: number; value: number }[];
  trend: "improving" | "degrading" | "stable";
  confidence: number;
}

interface EvidenceDrilldownModalProps {
  isOpen: boolean;
  evidence?: EvidenceDrilldown;
  onClose: () => void;
}

export const EvidenceDrilldownModal: React.FC<EvidenceDrilldownModalProps> = ({
  isOpen,
  evidence,
  onClose,
}) => {
  if (!isOpen || !evidence) return null;

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "improving":
        return "var(--neon-green)";
      case "degrading":
        return "var(--f1-red)";
      default:
        return "var(--amber)";
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "improving":
        return <TrendingDown style={{ width: 12, height: 12 }} />;
      case "degrading":
        return <TrendingUp style={{ width: 12, height: 12 }} />;
      default:
        return <Minus style={{ width: 12, height: 12 }} />;
    }
  };

  const getTrendLabel = (trend: string) => {
    switch (trend) {
      case "improving":
        return "IMPROVING";
      case "degrading":
        return "DEGRADING";
      default:
        return "STABLE";
    }
  };

  const stats = evidence.dataPoints.reduce(
    (acc, p) => {
      acc.min = Math.min(acc.min, p.value);
      acc.max = Math.max(acc.max, p.value);
      acc.sum += p.value;
      return acc;
    },
    { min: Infinity, max: -Infinity, sum: 0 },
  );

  const minValue = evidence.dataPoints.length > 0 ? stats.min : 0;
  const maxValue = evidence.dataPoints.length > 0 ? stats.max : 0;
  const range = maxValue - minValue || 1;
  const avgValue = evidence.dataPoints.length > 0 ? stats.sum / evidence.dataPoints.length : 0;
  const trendColor = getTrendColor(evidence.trend);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(10,10,11,0.88)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
        }}
      />

      {/* Modal panel */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 680,
          maxHeight: "90vh",
          overflowY: "auto",
          background: "linear-gradient(160deg, rgba(22,22,26,0.98) 0%, rgba(14,14,16,0.98) 100%)",
          border: "1px solid rgba(255,255,255,0.10)",
          borderTop: "1px solid rgba(255,255,255,0.16)",
          boxShadow: "0 0 0 1px rgba(225,6,0,0.2), 0 24px 64px rgba(0,0,0,0.8)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Red accent top bar */}
        <div
          style={{ height: 2, background: "linear-gradient(90deg, var(--f1-red), transparent)" }}
        />

        {/* Header */}
        <div
          style={{
            padding: "20px 24px 0",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            paddingBottom: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    color: trendColor,
                    padding: "3px 8px",
                    border: `1px solid ${trendColor}`,
                    background: `${trendColor}18`,
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                  }}
                >
                  {getTrendIcon(evidence.trend)}
                  {getTrendLabel(evidence.trend)}
                </div>
                <div
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: "var(--text-secondary)",
                  }}
                >
                  EVIDENCE DRILLDOWN
                </div>
              </div>
              <div
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: 14,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "var(--text-primary)",
                  letterSpacing: "0.05em",
                  marginBottom: 6,
                }}
              >
                {evidence.metric}
              </div>
              <div
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 11,
                  color: "var(--text-secondary)",
                  lineHeight: 1.5,
                }}
              >
                {evidence.evidence}
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "var(--text-secondary)",
                cursor: "pointer",
                padding: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--f1-red)";
                e.currentTarget.style.color = "var(--f1-red)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
            >
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 1,
            padding: "16px 24px",
            background: "rgba(0,0,0,0.2)",
          }}
        >
          {[
            { label: "Lap Range", value: `${evidence.lapRange[0]}–${evidence.lapRange[1]}` },
            { label: "Data Points", value: String(evidence.dataPoints.length) },
            { label: "Avg Value", value: avgValue.toFixed(1) },
            { label: "Confidence", value: `${(evidence.confidence * 100).toFixed(0)}%` },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                padding: "10px 12px",
                border: "1px solid rgba(255,255,255,0.06)",
                background: "rgba(255,255,255,0.02)",
              }}
            >
              <div
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "var(--text-secondary)",
                  marginBottom: 4,
                }}
              >
                {stat.label}
              </div>
              <div
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: 14,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Chart visualization */}
        <div style={{ padding: "16px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <BarChart3 style={{ width: 14, height: 14, color: "var(--f1-red)" }} />
            <span
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "var(--text-secondary)",
              }}
            >
              METRIC TIMELINE
            </span>
          </div>

          <div
            style={{
              position: "relative",
              height: 140,
              border: "1px solid rgba(255,255,255,0.07)",
              background: "rgba(0,0,0,0.3)",
              padding: "12px 12px 28px 36px",
            }}
          >
            {/* Y-axis labels */}
            <div
              style={{
                position: "absolute",
                left: 4,
                top: 10,
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 9,
                color: "var(--text-secondary)",
              }}
            >
              {maxValue.toFixed(1)}
            </div>
            <div
              style={{
                position: "absolute",
                left: 4,
                bottom: 28,
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 9,
                color: "var(--text-secondary)",
              }}
            >
              {minValue.toFixed(1)}
            </div>
            {/* Bars */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-around",
                gap: 2,
                height: "100%",
              }}
            >
              {evidence.dataPoints.map((point, idx) => {
                const normalizedValue = (point.value - minValue) / range;
                const heightPercent = Math.max(normalizedValue * 100, 4);
                return (
                  <div
                    key={idx}
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 4,
                      height: "100%",
                      justifyContent: "flex-end",
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        height: `${heightPercent}%`,
                        background: trendColor,
                        opacity: 0.7 + normalizedValue * 0.3,
                        boxShadow: `0 0 6px ${trendColor}44`,
                        cursor: "help",
                        transition: "opacity 0.15s",
                      }}
                      title={`Lap ${point.lap}: ${point.value.toFixed(2)}`}
                    />
                    {evidence.dataPoints.length <= 12 && (
                      <div
                        style={{
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: 8,
                          color: "var(--text-secondary)",
                          transform: "rotate(-45deg)",
                          transformOrigin: "center",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {point.lap}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div
            style={{
              marginTop: 6,
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 9,
              color: "var(--text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            Hover bars for exact values · Laps {evidence.lapRange[0]}–{evidence.lapRange[1]}
          </div>
        </div>

        {/* Min / Max */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 1,
            padding: "0 24px 16px",
          }}
        >
          <div
            style={{
              padding: "14px",
              border: "1px solid rgba(255,255,255,0.07)",
              background: "rgba(57,255,20,0.04)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <TrendingDown style={{ width: 14, height: 14, color: "var(--neon-green)" }} />
              <span
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "var(--text-secondary)",
                }}
              >
                BEST VALUE
              </span>
            </div>
            <div
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: 22,
                fontWeight: 700,
                color: "var(--neon-green)",
              }}
            >
              {minValue.toFixed(2)}
            </div>
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 10,
                color: "var(--text-secondary)",
                marginTop: 4,
              }}
            >
              Lowest recorded in range
            </div>
          </div>
          <div
            style={{
              padding: "14px",
              border: "1px solid rgba(255,255,255,0.07)",
              background: "rgba(225,6,0,0.04)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <AlertCircle style={{ width: 14, height: 14, color: "var(--f1-red)" }} />
              <span
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "var(--text-secondary)",
                }}
              >
                WORST VALUE
              </span>
            </div>
            <div
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: 22,
                fontWeight: 700,
                color: "var(--f1-red)",
              }}
            >
              {maxValue.toFixed(2)}
            </div>
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 10,
                color: "var(--text-secondary)",
                marginTop: 4,
              }}
            >
              Highest recorded in range
            </div>
          </div>
        </div>

        {/* Interpretation */}
        <div
          style={{
            margin: "0 24px 24px",
            padding: "14px",
            borderLeft: "2px solid var(--f1-red)",
            background: "rgba(225,6,0,0.04)",
            border: "1px solid rgba(225,6,0,0.2)",
          }}
        >
          <div
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "var(--text-secondary)",
              marginBottom: 8,
            }}
          >
            INTERPRETATION
          </div>
          <p
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              color: "var(--text-primary)",
              lineHeight: 1.6,
            }}
          >
            {evidence.trend === "improving"
              ? "This metric is showing improvement across the analyzed laps, indicating a positive performance trajectory. No immediate action required."
              : evidence.trend === "degrading"
                ? "This metric is degrading over time — wear, fuel load, or grip loss detected. Consider immediate strategic intervention."
                : "This metric is stable, indicating consistent performance without significant changes across the lap window."}
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, padding: "0 24px 24px" }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "10px 16px",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "transparent",
              color: "var(--text-primary)",
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
            }}
          >
            CLOSE
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "10px 16px",
              border: "1px solid var(--f1-red)",
              background: "var(--f1-red)",
              color: "white",
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.85";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
            }}
          >
            EXPORT DATA
          </button>
        </div>
      </div>
    </div>
  );
};
