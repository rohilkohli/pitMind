import { useEffect, useRef, useState, useCallback } from "react";
import type { WebSocketMessage, WebSocketMessageType } from "../types/api";

export type WebSocketStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "reconnecting"
  | "error"
  | "offline";

export interface StreamConnectionConfig {
  url: string;
  maxRetries?: number;
  initialBackoffMs?: number;
  maxBackoffMs?: number;
  heartbeatIntervalMs?: number;
  onMessage?: (message: WebSocketMessage) => void;
}

export interface StreamConnectionState {
  status: WebSocketStatus;
  latency: number;
  packetLoss: number;
  reconnectAttempts: number;
  uptime: number;
  lastConnected: string;
  error?: Error;
}

export const useStreamConnection = (config: StreamConnectionConfig) => {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const reconnectAttemptsRef = useRef(0);
  const isComponentMounted = useRef(true);
  // Store onMessage in a ref to avoid stale closures without adding it to deps
  const onMessageRef = useRef(config.onMessage);
  useEffect(() => {
    onMessageRef.current = config.onMessage;
  }, [config.onMessage]);

  const [state, setState] = useState<StreamConnectionState>({
    status: "connecting",
    latency: 0,
    packetLoss: 0,
    reconnectAttempts: 0,
    uptime: 0,
    lastConnected: new Date().toISOString(),
  });

  const [uptime, setUptime] = useState(0);
  const [latencyMeasurements, setLatencyMeasurements] = useState<number[]>([]);
  const [totalMessages, setTotalMessages] = useState(0);
  const [lostMessages, setLostMessages] = useState(0);

  // Auto-increment uptime
  useEffect(() => {
    const interval = setInterval(() => {
      setUptime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Measure packet loss
  useEffect(() => {
    const packetLoss =
      totalMessages > 0 ? parseFloat(((lostMessages / totalMessages) * 100).toFixed(2)) : 0;
    const avgLatency =
      latencyMeasurements.length > 0
        ? Math.round(latencyMeasurements.reduce((a, b) => a + b, 0) / latencyMeasurements.length)
        : 0;

    setState((prev) => ({
      ...prev,
      latency: avgLatency,
      packetLoss,
      uptime,
    }));
  }, [latencyMeasurements, totalMessages, lostMessages, uptime]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    // Prevent multiple simultaneous connection attempts
    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    // Clear any pending reconnect
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = undefined;
    }

    setState((prev) => ({ ...prev, status: "connecting" }));

    try {
      const ws = new WebSocket(config.url);

      ws.onopen = () => {
        if (!isComponentMounted.current) {
          ws.close();
          return;
        }
        console.log("[Stream] Connected");
        reconnectAttemptsRef.current = 0;
        setState((prev) => ({
          ...prev,
          status: "connected",
          reconnectAttempts: 0,
          lastConnected: new Date().toISOString(),
        }));

        // Start heartbeat to measure latency
        if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            const timestamp = Date.now();
            ws.send(JSON.stringify({ type: "ping", timestamp }));
            setTotalMessages((prev) => prev + 1);
          }
        }, config.heartbeatIntervalMs || 30000);
      };

      ws.onmessage = (event) => {
        if (!isComponentMounted.current) return;
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;

          // Handle pong response for latency measurement
          if (message.type === "pong" && message.timestamp) {
            const latency = Date.now() - new Date(message.timestamp).getTime();
            setLatencyMeasurements((prev) => {
              const updated = [...prev, latency];
              // Keep only last 10 measurements
              return updated.slice(-10);
            });
          }

          // Call user-provided message handler via ref (avoids stale closures)
          if (onMessageRef.current) {
            onMessageRef.current(message);
          }
        } catch (e) {
          console.error("[Stream] Failed to parse message:", e);
        }
      };

      ws.onerror = (event) => {
        if (!isComponentMounted.current) return;
        const isTransientHandshakeError = ws.readyState === WebSocket.CONNECTING;
        if (isTransientHandshakeError) {
          return;
        }
        // Only log errors if not at max retries and we didn't just unmount
        const maxRetries = config.maxRetries || 5;
        if (reconnectAttemptsRef.current < maxRetries && isComponentMounted.current) {
          console.error("[Stream] WebSocket error:", event);
        }
        setState((prev) => ({
          ...prev,
          status: "error",
          error: new Error("WebSocket error"),
        }));
        setLostMessages((prev) => prev + 1);
      };

      ws.onclose = () => {
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = undefined;
        }

        if (!isComponentMounted.current) return;

        const maxRetries = config.maxRetries || 5;

        // Check if we've exceeded max retries
        if (reconnectAttemptsRef.current >= maxRetries) {
          setState((prev) => ({
            ...prev,
            status: "offline",
          }));
          return;
        }

        setState((prev) => ({
          ...prev,
          status: "disconnected",
        }));

        // Increment attempts
        reconnectAttemptsRef.current += 1;

        // Schedule reconnection with exponential backoff
        setState((prev) => ({
          ...prev,
          status: "reconnecting",
          reconnectAttempts: reconnectAttemptsRef.current,
        }));

        // Exponential backoff: 1s, 2s, 4s, 8s, 16s
        const backoffSequence = [1000, 2000, 4000, 8000, 16000];
        const nextBackoffMs =
          backoffSequence[Math.min(reconnectAttemptsRef.current - 1, backoffSequence.length - 1)];

        console.log(
          `[Stream] Reconnecting in ${nextBackoffMs}ms (attempt ${reconnectAttemptsRef.current}/${maxRetries})`,
        );

        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, nextBackoffMs);
      };

      wsRef.current = ws;
    } catch (error) {
      if (!isComponentMounted.current) return;
      const maxRetries = config.maxRetries || 5;
      if (reconnectAttemptsRef.current < maxRetries) {
        console.error("[Stream] Connection failed:", error);
      }
      setState((prev) => ({
        ...prev,
        status: "error",
        error: error instanceof Error ? error : new Error("Unknown error"),
      }));
    }
  }, [config.url, config.maxRetries, config.heartbeatIntervalMs]);
  // Note: config.onMessage is intentionally excluded — it's read via onMessageRef to avoid stale closures.

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    clearTimeout(reconnectTimeoutRef.current);
    clearInterval(heartbeatIntervalRef.current);

    if (wsRef.current) {
      // Avoid closing while CONNECTING to prevent browser-level
      // "closed before the connection is established" warnings.
      if (wsRef.current.readyState === WebSocket.CONNECTING) {
        const pendingSocket = wsRef.current;
        pendingSocket.onopen = () => pendingSocket.close();
        pendingSocket.onmessage = null;
        pendingSocket.onerror = null;
        pendingSocket.onclose = null;
        wsRef.current = null;
      } else {
        wsRef.current.close();
        wsRef.current = null;
      }
    }

    setState((prev) => ({
      ...prev,
      status: "disconnected",
    }));
  }, []);

  // Manual reconnect
  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    setState((prev) => ({
      ...prev,
      reconnectAttempts: 0,
    }));
    setLatencyMeasurements([]);
    setTotalMessages(0);
    setLostMessages(0);
    disconnect();
    connect();
  }, [connect, disconnect]);

  // Send typed message
  const send = useCallback(<T = unknown>(type: WebSocketMessageType, data: T) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage<T> = {
        type,
        data,
        timestamp: new Date().toISOString(),
      };
      wsRef.current.send(JSON.stringify(message));
      setTotalMessages((prev) => prev + 1);
    } else {
      console.warn("[Stream] WebSocket not connected");
      setLostMessages((prev) => prev + 1);
    }
  }, []);

  // Auto-connect on mount — use refs to avoid reconnect loop
  const connectRef = useRef(connect);
  const disconnectRef = useRef(disconnect);

  useEffect(() => {
    connectRef.current = connect;
    disconnectRef.current = disconnect;
  });

  useEffect(() => {
    isComponentMounted.current = true;
    connectRef.current();

    return () => {
      isComponentMounted.current = false;
      disconnectRef.current();
    };
  }, []);

  return {
    state,
    send,
    reconnect,
    disconnect,
    isConnected: state.status === "connected",
  };
};
