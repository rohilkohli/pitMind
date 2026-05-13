import React, { useState, useEffect, useRef } from 'react';

interface LogEntry {
  id: string;
  timestamp: string;
  module: string;
  message: string;
  type: 'info' | 'warn' | 'error' | 'success';
}

const MODULES = ['TELEMETRY', 'AUTH', 'STRATEGY', 'FIREBASE', 'GRANITE-AI', 'NETWORK'];
const MESSAGES = [
  'Packet received: 284 bytes',
  'WebSocket handshake success',
  'Firebase stream sync: lap 27',
  'Granite-AI: Analyzing tyre deg...',
  'Heartbeat: latency 42ms',
  'New strategy recommendation generated',
  'Syncing race state to Firestore',
  'User role changed: STRATEGIST',
  'API request: /v1/strategy/recommend',
  'Cache hit: track_monaco_v2',
];

export const LiveSystemFeed: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const newLog: LogEntry = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        module: MODULES[Math.floor(Math.random() * MODULES.length)],
        message: MESSAGES[Math.floor(Math.random() * MESSAGES.length)],
        type: Math.random() > 0.9 ? 'warn' : Math.random() > 0.1 ? 'info' : 'success',
      };

      setLogs((prev) => [newLog, ...prev].slice(0, 50));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'warn': return 'text-amber-400';
      case 'error': return 'text-f1-red';
      case 'success': return 'text-emerald-400';
      default: return 'text-f1-secondary';
    }
  };

  return (
    <div className="flex flex-col h-full bg-f1-black border border-f1-border overflow-hidden">
      <div className="px-4 py-2 border-b border-f1-border bg-f1-dark flex items-center justify-between">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-f1-white">System Live Feed</h4>
        <div className="flex gap-1">
          <div className="h-1.5 w-1.5 rounded-full bg-f1-red animate-pulse" />
          <div className="h-1.5 w-1.5 rounded-full bg-f1-red animate-pulse [animation-delay:200ms]" />
          <div className="h-1.5 w-1.5 rounded-full bg-f1-red animate-pulse [animation-delay:400ms]" />
        </div>
      </div>
      
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-[10px] space-y-2 scrollbar-thin scrollbar-thumb-f1-red/20"
      >
        {logs.map((log) => (
          <div key={log.id} className="flex gap-3 animate-f1-fade-in">
            <span className="text-f1-muted shrink-0">[{log.timestamp}]</span>
            <span className="text-f1-red font-bold shrink-0">{log.module}</span>
            <span className={`${getTypeColor(log.type)} break-all`}>{log.message}</span>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="text-f1-muted animate-pulse">Initializing system log stream...</div>
        )}
      </div>

      <div className="px-4 py-2 border-t border-f1-border bg-f1-dark/50 text-[9px] text-f1-muted uppercase font-bold tracking-widest flex justify-between">
        <span>STATUS: NOMINAL</span>
        <span>BUFFER: {logs.length}/50</span>
      </div>
    </div>
  );
};
