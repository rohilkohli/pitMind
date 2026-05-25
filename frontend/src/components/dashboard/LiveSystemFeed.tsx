import React, { useState, useEffect } from "react";

interface LogEntry {
  id: string;
  timestamp: string;
  module: string;
  message: string;
  type: "info" | "warn" | "error" | "success";
}

const MODULES = ["TELEMETRY", "AUTH", "STRATEGY", "FIREBASE", "GRANITE-AI", "NETWORK"];
const MESSAGES = [
  "Packet received: 284 bytes",
  "WebSocket handshake success",
  "Firebase stream sync: lap 27",
  "Granite-AI: Analyzing tyre deg...",
  "Heartbeat: latency 42ms",
  "New strategy recommendation generated",
  "Syncing race state to Firestore",
  "User role changed: STRATEGIST",
  "API request: /v1/strategy/recommend",
  "Cache hit: track_monaco_v2",
];

const getTagClass = (module: string): string => {
  const m = module.toUpperCase();
  if (m === "NETWORK" || m === "TELEMETRY") return "pm-feed-tag pm-tag-net";
  if (m === "FIREBASE") return "pm-feed-tag pm-tag-fb";
  if (m === "AUTH") return "pm-feed-tag pm-tag-auth";
  return "pm-feed-tag pm-tag-sys"; // STRATEGY, GRANITE-AI, etc.
};

const getModuleLabel = (module: string): string => module.toUpperCase();

export const LiveSystemFeed: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    // Seed initial entries
    const initial: LogEntry[] = Array.from({ length: 5 }, (_, i) => {
      const module = MODULES[Math.floor(Math.random() * MODULES.length)];
      const now = new Date(Date.now() - (5 - i) * 2200);
      return {
        id: `init-${i}`,
        timestamp: now.toLocaleTimeString([], {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        module,
        message: MESSAGES[Math.floor(Math.random() * MESSAGES.length)],
        type: "info",
      };
    });
    setLogs(initial);

    const interval = setInterval(() => {
      const module = MODULES[Math.floor(Math.random() * MODULES.length)];
      const newLog: LogEntry = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toLocaleTimeString([], {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        module,
        message: MESSAGES[Math.floor(Math.random() * MESSAGES.length)],
        type: Math.random() > 0.9 ? "warn" : "info",
      };

      setLogs((prev) => [newLog, ...prev].slice(0, 8));
    }, 2200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "transparent",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Log entries — max 8 visible */}
      <div
        aria-live="polite"
        aria-label="Live system feed"
        style={{
          flex: 1,
          overflowY: "hidden",
          padding: "8px 0",
        }}
      >
        {logs.length === 0 && (
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10,
              color: "var(--text-secondary)",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              animation: "flicker 3s infinite",
            }}
          >
            Initializing system log stream...
          </div>
        )}
        {logs.map((log) => (
          <div key={log.id} className="pm-feed-item">
            <span className="pm-feed-time">[{log.timestamp}]</span>
            <span
              className={getTagClass(log.module)}
              title={getModuleLabel(log.module)}
              style={{
                borderRadius: 0,
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: "10px",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}
            >
              {getModuleLabel(log.module)}
            </span>
            <span className="pm-feed-text">{log.message}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "12px 0 0 0",
          borderTop: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            style={{
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: "var(--neon-green)",
            }}
          />
          <span
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 10,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "var(--text-secondary)",
              fontWeight: 700,
            }}
          >
            STATUS: NOMINAL
          </span>
        </div>
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            color: "var(--text-secondary)",
          }}
        >
          BUFFER: {logs.length}/8
        </span>
      </div>
    </div>
  );
};
