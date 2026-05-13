import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertTriangle, RotateCcw } from 'lucide-react';
import { useStream } from '../../contexts/StreamContext';

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error' | 'reconnecting' | 'offline';

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

const getStatusColor = (status: ConnectionStatus) => {
  switch (status) {
    case 'connected':
      return 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300';
    case 'connecting':
      return 'bg-amber-500/20 border-amber-500/30 text-amber-300 animate-pulse';
    case 'reconnecting':
      return 'bg-amber-500/20 border-amber-500/30 text-amber-300 animate-pulse';
    case 'disconnected':
      return 'bg-red-500/20 border-red-500/30 text-red-300';
    case 'error':
      return 'bg-red-500/20 border-red-500/30 text-red-300';
    case 'offline':
      return 'bg-slate-500/20 border-slate-500/30 text-slate-300';
    default:
      return 'bg-slate-500/20 border-slate-500/30 text-slate-300';
  }
};

const getStatusLabel = (status: ConnectionStatus) => {
  switch (status) {
    case 'connected':
      return 'Connected';
    case 'connecting':
      return 'Connecting...';
    case 'reconnecting':
      return 'Reconnecting...';
    case 'disconnected':
      return 'Disconnected';
    case 'error':
      return 'Connection Error';
    case 'offline':
      return 'Offline (Max Retries Exceeded)';
    default:
      return 'Unknown';
  }
};

const getStatusIcon = (status: ConnectionStatus) => {
  switch (status) {
    case 'connected':
      return <Wifi className="w-4 h-4" />;
    case 'connecting':
      return <Wifi className="w-4 h-4 animate-pulse" />;
    case 'reconnecting':
      return <Wifi className="w-4 h-4 animate-pulse" />;
    case 'disconnected':
    case 'error':
    case 'offline':
      return <WifiOff className="w-4 h-4" />;
    default:
      return null;
  }
};

export const StreamHealthMonitor: React.FC<StreamHealthMonitorProps> = ({
  showMetrics = true,
}) => {
  const { state, reconnect } = useStream();
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setUptime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  return (
    <div className={`rounded-xl border-2 p-4 ${getStatusColor(state.status)}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {getStatusIcon(state.status)}
          <span className="font-semibold text-sm">{getStatusLabel(state.status)}</span>
        </div>

        {(state.status === 'disconnected' || state.status === 'error') && (
          <button
            onClick={reconnect}
            className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium transition flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            Reconnect
          </button>
        )}
      </div>

      {/* Metrics grid */}
      {showMetrics && (
        <div className="grid grid-cols-3 gap-2 text-xs mb-3">
          <div>
            <div className="text-[10px] opacity-80">Latency</div>
            <div className="font-mono font-semibold">{state.latency}ms</div>
          </div>
          <div>
            <div className="text-[10px] opacity-80">Packet Loss</div>
            <div className="font-mono font-semibold">{state.packetLoss.toFixed(2)}%</div>
          </div>
          <div>
            <div className="text-[10px] opacity-80">Uptime</div>
            <div className="font-mono font-semibold">{formatUptime(uptime)}</div>
          </div>
        </div>
      )}

      {/* Health bars */}
      {state.status === 'connected' && (
        <div className="mt-3 space-y-2">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px]">Signal Strength</span>
              <span className="text-[10px]">{Math.round((1 - state.latency / 500) * 100)}%</span>
            </div>
            <div className="h-1 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500"
                style={{ width: `${Math.round((1 - state.latency / 500) * 100)}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px]">Link Quality</span>
              <span className="text-[10px]">{Math.round((1 - state.packetLoss / 5) * 100)}%</span>
            </div>
            <div className="h-1 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500"
                style={{ width: `${Math.round((1 - state.packetLoss / 5) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {(state.status === 'disconnected' || state.status === 'error') && (
        <div className="mt-3 p-2 rounded-lg bg-white/10 flex items-start gap-2 text-[11px]">
          <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span>Connection to telemetry stream lost. Data may be stale. Click Reconnect to restore.</span>
        </div>
      )}

      {/* Reconnecting state */}
      {state.status === 'reconnecting' && (
        <div className="mt-3 p-2 rounded-lg bg-white/10 flex items-start gap-2 text-[11px]">
          <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0 animate-pulse" />
          <span>Reconnection attempt {state.reconnectAttempts}. Retrying...</span>
        </div>
      )}
    </div>
  );
};
