import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useStreamConnection } from "./useStreamConnection";

// Mock WebSocket
class MockWebSocket {
  url: string;
  readyState: number = 0; // WebSocket.CONNECTING
  onopen: (() => void) | null = null;
  onmessage: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  onclose: (() => void) | null = null;

  static instances: MockWebSocket[] = [];

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }

  send = vi.fn();
  close = vi.fn(() => {
    this.readyState = 3; // WebSocket.CLOSED
    if (this.onclose) this.onclose();
  });
}

// Ensure global constants are set so hooks evaluate properly
global.WebSocket = MockWebSocket as any;
(global as any).WebSocket.CONNECTING = 0;
(global as any).WebSocket.OPEN = 1;
(global as any).WebSocket.CLOSING = 2;
(global as any).WebSocket.CLOSED = 3;

describe("useStreamConnection", () => {
  beforeEach(() => {
    MockWebSocket.instances = [];
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  const connectWs = (instanceIndex = 0) => {
    const ws = MockWebSocket.instances[instanceIndex];
    if (ws) {
      act(() => {
        ws.readyState = 1; // OPEN
        if (ws.onopen) ws.onopen();
      });
    }
  };

  const closeWs = (instanceIndex = 0) => {
    const ws = MockWebSocket.instances[instanceIndex];
    if (ws) {
      act(() => {
        ws.readyState = 3; // CLOSED
        if (ws.onclose) ws.onclose();
      });
    }
  };

  const triggerError = (instanceIndex = 0) => {
    const ws = MockWebSocket.instances[instanceIndex];
    if (ws) {
      act(() => {
        if (ws.onerror) {
          ws.onerror({ type: "error" } as any);
        }
      });
    }
  };

  const triggerMessage = (instanceIndex = 0, msg: any) => {
    const ws = MockWebSocket.instances[instanceIndex];
    if (ws) {
      act(() => {
        if (ws.onmessage) ws.onmessage({ data: JSON.stringify(msg) } as any);
      });
    }
  };

  it("should initialize and connect", () => {
    const { result } = renderHook(() => useStreamConnection({ url: "ws://localhost:1234" }));

    expect(result.current.state.status).toBe("connecting");

    connectWs(0);

    expect(result.current.state.status).toBe("connected");
    expect(result.current.isConnected).toBe(true);
  });

  it("should call onMessage when receiving a message", () => {
    const onMessage = vi.fn();
    renderHook(() => useStreamConnection({ url: "ws://localhost:1234", onMessage }));

    connectWs();

    triggerMessage(0, { type: "test", data: "hello" });

    expect(onMessage).toHaveBeenCalledWith({ type: "test", data: "hello" });
  });

  it("should handle disconnect", () => {
    const { result } = renderHook(() => useStreamConnection({ url: "ws://localhost:1234" }));

    connectWs();
    expect(result.current.state.status).toBe("connected");

    act(() => {
      result.current.disconnect();
    });

    expect(result.current.state.status).toBe("disconnected");
    expect(result.current.isConnected).toBe(false);
  });

  it("should handle reconnects logic and max retries", () => {
    const { result } = renderHook(() =>
      useStreamConnection({ url: "ws://localhost:1234", maxRetries: 2 }),
    );

    connectWs();

    // Attempt 1: Close connection
    closeWs(0);
    expect(result.current.state.status).toBe("reconnecting");
    expect(result.current.state.reconnectAttempts).toBe(1);

    // Wait 1 second for first reconnect attempt to fire connect() timeout
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(MockWebSocket.instances.length).toBe(2);

    // Attempt 2: simulate failure by immediately closing the new instance
    closeWs(1);

    expect(result.current.state.reconnectAttempts).toBe(2);

    // Wait 2 seconds for second reconnect attempt
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(MockWebSocket.instances.length).toBe(3);

    // Limit reached.
    closeWs(2);

    expect(result.current.state.status).toBe("offline");
  });

  it("should measure latency via ping/pong heartbeat", () => {
    const { result } = renderHook(() =>
      useStreamConnection({ url: "ws://localhost:1234", heartbeatIntervalMs: 5000 }),
    );

    connectWs();
    const ws = MockWebSocket.instances[0];

    // Trigger heartbeat interval
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // Expect a ping to be sent
    expect(ws.send).toHaveBeenCalled();
    const sentMessage = JSON.parse(ws.send.mock.calls[0][0]);
    expect(sentMessage.type).toBe("ping");

    // Simulate pong response with a specific timestamp to calculate latency
    act(() => {
      vi.setSystemTime(vi.getMockedSystemTime()!.getTime() + 100);
    });
    triggerMessage(0, { type: "pong", timestamp: sentMessage.timestamp });

    expect(result.current.state.latency).toBe(100);
  });

  it("should send messages", () => {
    const { result } = renderHook(() => useStreamConnection({ url: "ws://localhost:1234" }));

    connectWs();
    const ws = MockWebSocket.instances[0];

    act(() => {
      result.current.send("custom_action", { foo: "bar" });
    });

    expect(ws.send).toHaveBeenCalled();
    const sentData = JSON.parse(ws.send.mock.calls[0][0]);
    expect(sentData.type).toBe("custom_action");
    expect(sentData.data).toEqual({ foo: "bar" });
  });

  it("should handle errors", () => {
    const { result } = renderHook(() => useStreamConnection({ url: "ws://localhost:1234" }));

    connectWs();

    triggerError(0);

    expect(result.current.state.status).toBe("error");
    expect(result.current.state.error).toBeInstanceOf(Error);
  });
});
