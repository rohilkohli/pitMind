import { useEffect, useRef, useState, useCallback } from 'react';

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error';

export interface StreamConnectionConfig {
  url: string;
  maxRetries?: number;
  initialBackoffMs?: number;
  maxBackoffMs?: number;
  heartbeatIntervalMs?: number;
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
  
  const [state, setState] = useState<StreamConnectionState>({
    status: 'connecting',
    latency: 0,
    packetLoss: 0,
    reconnectAttempts: 0,
    uptime: 0,
    lastConnected: new Date().toISOString(),
  });

  const [backoffMs, setBackoffMs] = useState(config.initialBackoffMs || 1000);
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
      totalMessages > 0
        ? parseFloat(((lostMessages / totalMessages) * 100).toFixed(2))
        : 0;
    const avgLatency =
      latencyMeasurements.length > 0
        ? Math.round(
            latencyMeasurements.reduce((a, b) => a + b, 0) / latencyMeasurements.length
          )
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
    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    setState((prev) => ({ ...prev, status: 'connecting' }));

    try {
      const ws = new WebSocket(config.url);

      ws.onopen = () => {
        console.log('[Stream] Connected');
        setState((prev) => ({
          ...prev,
          status: 'connected',
          reconnectAttempts: 0,
          lastConnected: new Date().toISOString(),
        }));
        setBackoffMs(config.initialBackoffMs || 1000);

        // Start heartbeat to measure latency
        heartbeatIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            const timestamp = Date.now();
            ws.send(JSON.stringify({ type: 'ping', timestamp }));
            setTotalMessages((prev) => prev + 1);
          }
        }, config.heartbeatIntervalMs || 30000);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          // Handle pong response
          if (message.type === 'pong' && message.timestamp) {
            const latency = Date.now() - message.timestamp;
            setLatencyMeasurements((prev) => {
              const updated = [...prev, latency];
              // Keep only last 10 measurements
              return updated.slice(-10);
            });
          }
        } catch (e) {
          console.error('[Stream] Failed to parse message:', e);
        }
      };

      ws.onerror = (event) => {
        console.error('[Stream] WebSocket error:', event);
        setState((prev) => ({
          ...prev,
          status: 'error',
          error: new Error('WebSocket error'),
        }));
        setLostMessages((prev) => prev + 1);
      };

      ws.onclose = () => {
        console.log('[Stream] Disconnected');
        clearInterval(heartbeatIntervalRef.current);
        setState((prev) => ({
          ...prev,
          status: 'disconnected',
        }));
        
        // Schedule reconnection with exponential backoff
        if (state.reconnectAttempts < (config.maxRetries || 10)) {
          setState((prev) => ({
            ...prev,
            status: 'reconnecting',
            reconnectAttempts: prev.reconnectAttempts + 1,
          }));

          reconnectTimeoutRef.current = setTimeout(() => {
            const nextBackoff = Math.min(
              backoffMs * 2,
              config.maxBackoffMs || 30000
            );
            setBackoffMs(nextBackoff);
            connect();
          }, backoffMs);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('[Stream] Connection failed:', error);
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error : new Error('Unknown error'),
      }));
    }
  }, [config, backoffMs, state.reconnectAttempts]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    clearTimeout(reconnectTimeoutRef.current);
    clearInterval(heartbeatIntervalRef.current);
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setState((prev) => ({
      ...prev,
      status: 'disconnected',
    }));
  }, []);

  // Manual reconnect
  const reconnect = useCallback(() => {
    setState((prev) => ({
      ...prev,
      reconnectAttempts: 0,
    }));
    setBackoffMs(config.initialBackoffMs || 1000);
    setLatencyMeasurements([]);
    setTotalMessages(0);
    setLostMessages(0);
    disconnect();
    connect();
  }, [config.initialBackoffMs, connect, disconnect]);

  // Send message
  const send = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
      setTotalMessages((prev) => prev + 1);
    } else {
      console.warn('[Stream] WebSocket not connected');
      setLostMessages((prev) => prev + 1);
    }
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    state,
    send,
    reconnect,
    disconnect,
    isConnected: state.status === 'connected',
  };
};
