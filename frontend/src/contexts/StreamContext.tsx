import React, { createContext, useContext } from "react";
import { useStreamConnection, type StreamConnectionState } from "../hooks/useStreamConnection";
import type { WebSocketMessageType } from "../types/api";

interface StreamContextType {
  state: StreamConnectionState;
  send: <T = unknown>(type: WebSocketMessageType, data: T) => void;
  reconnect: () => void;
  disconnect: () => void;
  isConnected: boolean;
}

const StreamContext = createContext<StreamContextType | undefined>(undefined);

interface StreamProviderProps {
  children: React.ReactNode;
  wsUrl: string;
  maxRetries?: number;
  heartbeatIntervalMs?: number;
}

export const StreamProvider: React.FC<StreamProviderProps> = ({
  children,
  wsUrl,
  maxRetries = 10,
  heartbeatIntervalMs = 30000,
}) => {
  const stream = useStreamConnection({
    url: wsUrl,
    maxRetries,
    heartbeatIntervalMs,
    initialBackoffMs: 1000,
    maxBackoffMs: 30000,
  });

  return <StreamContext.Provider value={stream}>{children}</StreamContext.Provider>;
};

export const useStream = () => {
  const context = useContext(StreamContext);
  if (!context) {
    throw new Error("useStream must be used within StreamProvider");
  }
  return context;
};
