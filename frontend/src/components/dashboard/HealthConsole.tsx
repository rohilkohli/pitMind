import React, { useState, useEffect } from "react";

export interface HealthMetric {
  name: string;
  status: "healthy" | "warning" | "critical";
  value: string | number;
  unit?: string;
  threshold?: number;
  lastUpdated?: string;
}

export interface HealthSnapshot {
  api: HealthMetric;
  latency: HealthMetric;
  dataQuality: HealthMetric;
  engineerApprovals: HealthMetric;
  uptime: HealthMetric;
  strategyCallCount: HealthMetric;
  errorRate: HealthMetric;
  telemetryDatapoints: HealthMetric;
  ai: HealthMetric;
}

interface HealthConsoleProps {
  onRefresh?: () => void;
}

// Mock health snapshot
const MOCK_HEALTH: HealthSnapshot = {
  api: {
    name: "API Gateway",
    status: "healthy",
    value: "Online",
    lastUpdated: "2 seconds ago",
  },
  latency: {
    name: "Response Latency",
    status: "healthy",
    value: 142,
    unit: "ms",
    threshold: 500,
    lastUpdated: "1 second ago",
  },
  dataQuality: {
    name: "Data Quality Score",
    status: "healthy",
    value: 96.8,
    unit: "%",
    threshold: 90,
    lastUpdated: "5 seconds ago",
  },
  engineerApprovals: {
    name: "Engineer Approvals",
    status: "healthy",
    value: 4,
    unit: "decisions",
    lastUpdated: "3 minutes ago",
  },
  uptime: {
    name: "System Uptime",
    status: "healthy",
    value: "4h 23m",
    lastUpdated: "1 second ago",
  },
  strategyCallCount: {
    name: "Strategy Calls",
    status: "healthy",
    value: 12,
    unit: "total",
    lastUpdated: "2 minutes ago",
  },
  errorRate: {
    name: "Error Rate",
    status: "healthy",
    value: 0.3,
    unit: "%",
    threshold: 2.0,
    lastUpdated: "1 second ago",
  },
  telemetryDatapoints: {
    name: "Telemetry Points",
    status: "healthy",
    value: 2847,
    unit: "pts",
    lastUpdated: "1 second ago",
  },
  ai: {
    name: "AI Engine",
    status: "healthy",
    value: "Optimal",
    lastUpdated: "Just now",
  },
};

export const HealthConsole: React.FC<HealthConsoleProps> = () => {
  const [health, setHealth] = useState<HealthSnapshot>(MOCK_HEALTH);

  const fetchHealth = async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
      const response = await fetch(`${baseUrl}/api/v1/metrics/health`);
      if (response.ok) {
        const data = await response.json();
        setHealth(data);
      }
    } catch (error) {
      console.error("Failed to fetch health metrics:", error);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const metrics = [
    health.api,
    health.latency,
    health.dataQuality,
    health.engineerApprovals,
    health.uptime,
    health.strategyCallCount,
    health.errorRate,
    health.telemetryDatapoints,
    health.ai,
  ];

  const getLatencyColor = (latency: number) => {
    if (latency < 200) return "var(--neon-green)";
    if (latency < 500) return "var(--amber)";
    return "var(--f1-red)";
  };

  return (
    <div style={{ background: "transparent" }}>
      {/* Metrics grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "8px",
          marginBottom: "16px",
        }}
      >
        {metrics
          .filter((m) => m)
          .map((metric, idx) => (
            <div key={idx} className="pm-health-metric relative overflow-hidden">
              <div className="pm-health-label">{metric.name || "System Metric"}</div>
              <div
                className={`pm-health-val ${metric.status === "warning" ? "warn" : metric.status === "critical" ? "crit" : ""}`}
              >
                <span
                  className="pm-health-value"
                  style={{
                    color: metric.name?.toLowerCase()?.includes("latency")
                      ? getLatencyColor(Number(metric.value))
                      : undefined,
                  }}
                >
                  {metric.value}
                </span>
                {metric.unit && (
                  <span
                    className="pm-health-unit"
                    style={{
                      color: "var(--text-secondary)",
                      textTransform: "uppercase",
                      fontFamily: "'IBM Plex Mono', monospace",
                    }}
                  >
                    {metric.unit}
                  </span>
                )}
              </div>

              {/* Threshold indicator */}
              <div
                className="absolute bottom-0 left-0 w-full h-[2px]"
                style={{ background: "rgba(255,255,255,0.05)" }}
              >
                {metric.threshold && (
                  <div
                    className="h-full"
                    style={{
                      background:
                        metric.status === "healthy"
                          ? "var(--neon-green)"
                          : metric.status === "warning"
                            ? "var(--amber)"
                            : "var(--f1-red)",
                      width: `${Math.min(100, (Number(metric.value) / Number(metric.threshold)) * 100)}%`,
                    }}
                  />
                )}
              </div>

              <div
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: "10px",
                  color: "var(--text-secondary)",
                  textTransform: "uppercase",
                  marginTop: "4px",
                }}
              >
                {metric.lastUpdated
                  ?.replace(/seconds? ago/, "s ago")
                  .replace(/minutes? ago/, "m ago")
                  .replace("Just now", "0s ago")}
              </div>
            </div>
          ))}
      </div>

      {/* Performance Timeline */}
      <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid var(--border)" }}>
        <h4
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "var(--text-secondary)",
            marginBottom: "12px",
          }}
        >
          Performance Timeline
        </h4>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {/* API Latency */}
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                marginBottom: "4px",
              }}
            >
              <span
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "var(--text-secondary)",
                }}
              >
                API Latency
              </span>
              <span
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: "10px",
                  fontWeight: 700,
                  color: getLatencyColor(Number(health.latency?.value || 0)),
                }}
              >
                {health.latency?.value || 0}ms
              </span>
            </div>
            <div
              style={{
                height: "4px",
                background: "rgba(255,255,255,0.05)",
                width: "100%",
                position: "relative",
              }}
            >
              <div
                style={{
                  height: "100%",
                  transition: "width 0.6s ease-out",
                  background: getLatencyColor(Number(health.latency?.value || 0)),
                  width: `${Math.min(100, (Number(health.latency?.value || 0) / 500) * 100)}%`,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  width: "1px",
                  background: "rgba(255,255,255,0.2)",
                  left: "40%",
                }}
                title="Threshold: 200ms"
              />
            </div>
          </div>

          {/* Data Quality */}
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                marginBottom: "4px",
              }}
            >
              <span
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "var(--text-secondary)",
                }}
              >
                Data Quality Score
              </span>
              <span
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                {health.dataQuality?.value || 0}%
              </span>
            </div>
            <div
              style={{
                height: "4px",
                background: "rgba(255,255,255,0.05)",
                width: "100%",
                position: "relative",
              }}
            >
              <div
                style={{
                  height: "100%",
                  transition: "width 0.6s ease-out",
                  background:
                    Number(health.dataQuality?.value || 0) >= 90
                      ? "var(--neon-green)"
                      : "var(--amber)",
                  width: `${health.dataQuality?.value || 0}%`,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  width: "1px",
                  background: "rgba(255,255,255,0.2)",
                  left: "90%",
                }}
                title="Threshold: 90%"
              />
            </div>
          </div>

          {/* Error Rate */}
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                marginBottom: "4px",
              }}
            >
              <span
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "var(--text-secondary)",
                }}
              >
                Error Rate
              </span>
              <span
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                {health.errorRate?.value || 0}%
              </span>
            </div>
            <div
              style={{
                height: "4px",
                background: "rgba(255,255,255,0.05)",
                width: "100%",
                position: "relative",
              }}
            >
              <div
                style={{
                  height: "100%",
                  transition: "width 0.6s ease-out",
                  background:
                    Number(health.errorRate?.value || 0) < 1.0
                      ? "var(--neon-green)"
                      : Number(health.errorRate?.value || 0) < 2.0
                        ? "var(--amber)"
                        : "var(--f1-red)",
                  width: `${Math.min(100, (Number(health.errorRate?.value || 0) / 2) * 100)}%`,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  width: "1px",
                  background: "rgba(255,255,255,0.2)",
                  left: "50%",
                }}
                title="Threshold: 1.0%"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
