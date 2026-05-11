import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useStreamConnection } from '../src/hooks/useStreamConnection';

// Mock WebSocket
class MockWebSocket {
  url: string;
  readyState = 0;
  onopen: (() => void) | null = null;
  onmessage: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  onclose: (() => void) | null = null;

  constructor(url: string) {
    this.url = url;
    // Simulate connection after a tick
    setTimeout(() => {
      this.readyState = 1; // OPEN
      this.onopen?.();
    }, 0);
  }

  send(data: string) {
    // Simulate pong response
    const message = JSON.parse(data);
    if (message.type === 'ping') {
      setTimeout(() => {
        this.onmessage?.({
          data: JSON.stringify({
            type: 'pong',
            timestamp: message.timestamp,
          }),
        });
      }, 10);
    }
  }

  close() {
    this.readyState = 3; // CLOSED
    this.onclose?.();
  }
}

// @ts-ignore
global.WebSocket = MockWebSocket;

describe('useStreamConnection', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with connecting status', () => {
    const { result } = renderHook(() =>
      useStreamConnection({
        url: 'ws://localhost:8001/api/v1/stream/telemetry',
      })
    );

    expect(result.current.state.status).toBe('connecting');
  });

  it('should transition to connected status', async () => {
    const { result } = renderHook(() =>
      useStreamConnection({
        url: 'ws://localhost:8001/api/v1/stream/telemetry',
      })
    );

    act(() => {
      vi.runAllTimers();
    });

    await waitFor(() => {
      expect(result.current.state.status).toBe('connected');
    });
  });

  it('should expose send function', () => {
    const { result } = renderHook(() =>
      useStreamConnection({
        url: 'ws://localhost:8001/api/v1/stream/telemetry',
      })
    );

    expect(typeof result.current.send).toBe('function');
  });

  it('should expose reconnect function', () => {
    const { result } = renderHook(() =>
      useStreamConnection({
        url: 'ws://localhost:8001/api/v1/stream/telemetry',
      })
    );

    expect(typeof result.current.reconnect).toBe('function');
  });

  it('should expose isConnected flag', async () => {
    const { result } = renderHook(() =>
      useStreamConnection({
        url: 'ws://localhost:8001/api/v1/stream/telemetry',
      })
    );

    act(() => {
      vi.runAllTimers();
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });
  });

  it('should track uptime', async () => {
    const { result } = renderHook(() =>
      useStreamConnection({
        url: 'ws://localhost:8001/api/v1/stream/telemetry',
      })
    );

    act(() => {
      vi.runAllTimers();
    });

    await waitFor(() => {
      expect(result.current.state.uptime).toBeGreaterThan(0);
    });
  });

  it('should measure latency on ping/pong', async () => {
    const { result } = renderHook(() =>
      useStreamConnection({
        url: 'ws://localhost:8001/api/v1/stream/telemetry',
        heartbeatIntervalMs: 100,
      })
    );

    act(() => {
      vi.advanceTimersByTime(200);
    });

    await waitFor(() => {
      expect(result.current.state.latency).toBeGreaterThanOrEqual(0);
    });
  });

  it('should reset on reconnect', async () => {
    const { result } = renderHook(() =>
      useStreamConnection({
        url: 'ws://localhost:8001/api/v1/stream/telemetry',
      })
    );

    act(() => {
      vi.runAllTimers();
    });

    await waitFor(() => {
      expect(result.current.state.status).toBe('connected');
    });

    act(() => {
      result.current.reconnect();
    });

    expect(result.current.state.reconnectAttempts).toBe(0);
  });
});
