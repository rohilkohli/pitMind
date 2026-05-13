import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { useStream } from '../../contexts/StreamContext';

export const StreamErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state, reconnect } = useStream();

  if (state.status === 'error') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-8 max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <h2 className="text-xl font-semibold text-white">Stream Connection Error</h2>
          </div>

          <p className="text-sm text-f1-muted mb-6">
            The connection to the telemetry stream has failed. Please check your network connection and try reconnecting.
          </p>

          {state.error && (
            <div className="mb-6 p-3 rounded-lg bg-black/20 border border-white/10">
              <p className="text-xs font-mono text-f1-muted">{state.error.message}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={reconnect}
              className="flex-1 px-4 py-2 rounded-lg bg-f1-red hover:bg-f1-red-dark text-white font-medium transition flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reconnect
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
