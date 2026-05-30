import React from "react";
import { Wifi, WifiOff, AlertTriangle, RotateCcw } from "lucide-react";
import { useStream } from "../../contexts/StreamContext";

export type ConnectionStatus =
  | "connected"
  | "connecting"
  | "disconnected"
  | "error"
  | "reconnecting"
  | "offline";

export interface StreamHealth {
  status: ConnectionStatus;
  latency: number;
  packetLoss: number;
  uptime: number;
  lastConnected: string;
  reconnectAttempts: number;
}

interface StreamHealthMonitorProps {
  showMetrics?: boolean;
}

export const getStatusColor = (status: ConnectionStatus) => {
  switch (status) {
    case "connected":
      return "bg-[var(--neon-green-dim)] border-[var(--neon-green)] text-[var(--neon-green)]";
    case "connecting":
      return "bg-[var(--amber-dim)] border-[var(--amber)] text-[var(--amber)] animate-pulse";
    case "reconnecting":
      return "bg-[var(--amber-dim)] border-[var(--amber)] text-[var(--amber)] animate-pulse";
    case "disconnected":
      return "bg-[var(--f1-red-dim)] border-[var(--f1-red)] text-[var(--f1-red)]";
    case "error":
      return "bg-[var(--f1-red-dim)] border-[var(--f1-red)] text-[var(--f1-red)]";
    case "offline":
      return "bg-[var(--carbon-mid)] border-[var(--border)] text-[var(--text-secondary)]";
    default:
      return "bg-[var(--carbon-mid)] border-[var(--border)] text-[var(--text-secondary)]";
  }
};

const getStatusLabel = (status: ConnectionStatus) => {
  switch (status) {
    case "connected":
      return "Connected";
    case "connecting":
      return "Connecting...";
    case "reconnecting":
      return "Reconnecting...";
    case "disconnected":
      return "Disconnected";
    case "error":
      return "Connection Error";
    case "offline":
      return "Offline (Max Retries Exceeded)";
    default:
      return "Unknown";
  }
};

const getStatusIcon = (status: ConnectionStatus) => {
  switch (status) {
    case "connected":
      return <Wifi className="w-4 h-4" />;
    case "connecting":
      return <Wifi className="w-4 h-4 animate-pulse" />;
    case "reconnecting":
      return <Wifi className="w-4 h-4 animate-pulse" />;
    case "disconnected":
    case "error":
    case "offline":
      return <WifiOff className="w-4 h-4" />;
    default:
      return null;
  }
};

export const StreamHealthMonitor: React.FC<StreamHealthMonitorProps> = ({ showMetrics = true }) => {
  const { state, reconnect } = useStream();
  // Use uptime from the stream state — avoids a duplicate setInterval
  // (useStreamConnection already maintains its own uptime counter)
  const uptime = state.uptime;

  const formatUptime = (seconds: number) => {

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  return (
    <div
      className={`border p-2 ${showMetrics ? "p-4 border-2" : "p-2 border"} ${getStatusColor(state.status)} transition-all duration-300`}
    >
      <div className={`flex items-center justify-between ${showMetrics ? "mb-3" : "mb-0"} gap-4`}>
        <div className="flex items-center gap-2">
          <div className={`${showMetrics ? "" : "scale-75"}`}>{getStatusIcon(state.status)}</div>
          <span
            className={`font-label uppercase tracking-widest ${showMetrics ? "text-sm" : "text-[10px]"}`}
          >
            {getStatusLabel(state.status)}
          </span>
        </div>

        {(state.status === "disconnected" || state.status === "error") && (
          <button
            onClick={reconnect}
            className="px-2 py-1 bg-[var(--carbon-mid)] hover:bg-[var(--carbon-light)] text-[9px] font-label font-bold uppercase transition flex items-center gap-1 border border-[var(--border)]"
          >
            <RotateCcw className="w-2.5 h-2.5" />
            Reconnect
          </button>
        )}
      </div>

      {/* Metrics grid */}
      {showMetrics && (
        <div className="grid grid-cols-3 gap-2 text-xs mb-3 font-tele">
          <div>
            <div className="text-[10px] text-[var(--text-secondary)] font-label uppercase tracking-wider">
              Latency
            </div>
            <div className="font-semibold text-[var(--text-primary)]">{state.latency}ms</div>
          </div>
          <div>
            <div className="text-[10px] text-[var(--text-secondary)] font-label uppercase tracking-wider">
              Packet Loss
            </div>
            <div className="font-semibold text-[var(--text-primary)]">
              {state.packetLoss.toFixed(2)}%
            </div>
          </div>
          <div>
            <div className="text-[10px] text-[var(--text-secondary)] font-label uppercase tracking-wider">
              Uptime
            </div>
            <div className="font-semibold text-[var(--text-primary)]">{formatUptime(uptime)}</div>
          </div>
        </div>
      )}

      {/* Health bars */}
      {state.status === "connected" && (
        <div className="mt-3 space-y-2">
          <div>
            <div className="flex justify-between items-center mb-1 font-tele">
              <span className="text-[10px] text-[var(--text-secondary)] font-label uppercase tracking-wider">
                Signal Strength
              </span>
              <span className="text-[10px] text-[var(--text-primary)]">
                {Math.round((1 - state.latency / 500) * 100)}%
              </span>
            </div>
            <div className="h-1 bg-[var(--carbon-mid)] overflow-hidden">
              <div
                className="h-full bg-[var(--neon-green)]"
                style={{ width: `${Math.round((1 - state.latency / 500) * 100)}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1 font-tele">
              <span className="text-[10px] text-[var(--text-secondary)] font-label uppercase tracking-wider">
                Link Quality
              </span>
              <span className="text-[10px] text-[var(--text-primary)]">
                {Math.round((1 - state.packetLoss / 5) * 100)}%
              </span>
            </div>
            <div className="h-1 bg-[var(--carbon-mid)] overflow-hidden">
              <div
                className="h-full bg-[var(--neon-green)]"
                style={{ width: `${Math.round((1 - state.packetLoss / 5) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {(state.status === "disconnected" || state.status === "error") && (
        <div className="mt-3 p-2 bg-[var(--carbon-mid)] border border-[var(--border)] flex items-start gap-2 text-[11px] font-tele text-[var(--text-secondary)]">
          <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0 text-[var(--f1-red)]" />
          <span>
            Connection to telemetry stream lost. Data may be stale. Click Reconnect to restore.
          </span>
        </div>
      )}

      {/* Reconnecting state */}
      {state.status === "reconnecting" && (
        <div className="mt-3 p-2 bg-[var(--carbon-mid)] border border-[var(--border)] flex items-start gap-2 text-[11px] font-tele text-[var(--text-secondary)]">
          <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0 animate-pulse text-[var(--amber)]" />
          <span>Reconnection attempt {state.reconnectAttempts}. Retrying...</span>
        </div>
      )}
    </div>
  );
};
