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
      case 'warn': return 'text-[#FFC906]';
      case 'error': return 'text-f1-red';
      case 'success': return 'text-[#39B54A]';
      default: return 'text-[#C4C4C4]';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1F1F27] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#38383F] bg-[#1F1F27] flex items-center justify-between">
        <h4 className="f1-section-title !mb-0">System Live Feed</h4>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-f1-red animate-pulse" />
          <span className="text-[9px] font-black text-f1-red uppercase tracking-widest">Live</span>
        </div>
      </div>
      
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto p-5 font-mono text-[11px] space-y-2.5 bg-[#15151E]/40 scrollbar-thin"
      >
        {logs.map((log) => (
          <div key={log.id} className="flex gap-4 opacity-90 hover:opacity-100 transition-opacity">
            <span className="text-[#67676D] shrink-0 font-medium">[{log.timestamp}]</span>
            <span className="text-white font-bold shrink-0 opacity-40">{log.module}</span>
            <span className={`${getTypeColor(log.type)} break-all font-medium tracking-tight`}>{log.message}</span>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="text-[#67676D] animate-pulse font-bold uppercase tracking-widest text-[10px]">Initializing system log stream...</div>
        )}
      </div>

      <div className="px-5 py-3 border-t border-[#38383F] bg-[#1F1F27] text-[10px] text-[#67676D] uppercase font-bold tracking-[0.2em] flex justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1 h-1 rounded-full bg-[#39B54A]" />
          <span>STATUS: NOMINAL</span>
        </div>
        <span>BUFFER: {logs.length}/50</span>
      </div>
    </div>
  );
};
