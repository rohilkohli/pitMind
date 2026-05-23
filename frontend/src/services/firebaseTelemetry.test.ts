import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const initializeAppMock = vi.fn();
const getDatabaseMock = vi.fn();
const forceWebSocketsMock = vi.fn();

vi.mock("firebase/app", () => ({
  initializeApp: (...args: unknown[]) => initializeAppMock(...args),
}));

vi.mock("firebase/database", async (importOriginal) => {
  const actual = await importOriginal<typeof import("firebase/database")>();
  return {
    ...actual,
    getDatabase: (...args: unknown[]) => getDatabaseMock(...args),
    forceWebSockets: (...args: unknown[]) => forceWebSocketsMock(...args),
  };
});

describe("initFirebaseFromEnv", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    initializeAppMock.mockReset();
    getDatabaseMock.mockReset();
    forceWebSocketsMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return null if env vars are missing", async () => {
    vi.stubEnv("VITE_FIREBASE_WEB_API_KEY", "");
    vi.stubEnv("VITE_FIREBASE_DATABASE_URL", "");
    const { initFirebaseFromEnv } = await import("./firebaseTelemetry");
    expect(initFirebaseFromEnv()).toBeNull();
  });

  it("should return null if url is missing", async () => {
    vi.stubEnv("VITE_FIREBASE_WEB_API_KEY", "test-key");
    vi.stubEnv("VITE_FIREBASE_DATABASE_URL", "");
    const { initFirebaseFromEnv } = await import("./firebaseTelemetry");
    expect(initFirebaseFromEnv()).toBeNull();
  });

  it("should return null if api key is missing", async () => {
    vi.stubEnv("VITE_FIREBASE_WEB_API_KEY", "");
    vi.stubEnv("VITE_FIREBASE_DATABASE_URL", "test-url");
    const { initFirebaseFromEnv } = await import("./firebaseTelemetry");
    expect(initFirebaseFromEnv()).toBeNull();
  });

  it("should initialize app and database if env vars are present", async () => {
    vi.stubEnv("VITE_FIREBASE_WEB_API_KEY", "test-key");
    vi.stubEnv("VITE_FIREBASE_DATABASE_URL", "test-url");

    const mockApp = { name: "[DEFAULT]" };
    const mockDb = { app: mockApp };

    initializeAppMock.mockReturnValue(mockApp);
    getDatabaseMock.mockReturnValue(mockDb);

    const { initFirebaseFromEnv } = await import("./firebaseTelemetry");
    const db = initFirebaseFromEnv();

    expect(db).toBe(mockDb);
    expect(initializeAppMock).toHaveBeenCalledTimes(1);
    expect(initializeAppMock).toHaveBeenCalledWith({
      apiKey: "test-key",
      databaseURL: "test-url",
    });
    expect(forceWebSocketsMock).toHaveBeenCalledTimes(1);
    expect(getDatabaseMock).toHaveBeenCalledTimes(1);
    expect(getDatabaseMock).toHaveBeenCalledWith(mockApp);
  });

  it("should reuse cached app and database instances on subsequent calls", async () => {
    vi.stubEnv("VITE_FIREBASE_WEB_API_KEY", "test-key");
    vi.stubEnv("VITE_FIREBASE_DATABASE_URL", "test-url");

    const mockApp = { name: "[DEFAULT]" };
    const mockDb = { app: mockApp };

    initializeAppMock.mockReturnValue(mockApp);
    getDatabaseMock.mockReturnValue(mockDb);

    const { initFirebaseFromEnv } = await import("./firebaseTelemetry");
    const db1 = initFirebaseFromEnv();
    const db2 = initFirebaseFromEnv();

    expect(db1).toBe(mockDb);
    expect(db2).toBe(mockDb);
    expect(initializeAppMock).toHaveBeenCalledTimes(1);
    expect(forceWebSocketsMock).toHaveBeenCalledTimes(1);
    expect(getDatabaseMock).toHaveBeenCalledTimes(1);
  });

  it("should catch errors during initialization, return null, and reset cache", async () => {
    vi.stubEnv("VITE_FIREBASE_WEB_API_KEY", "test-key");
    vi.stubEnv("VITE_FIREBASE_DATABASE_URL", "test-url");

    initializeAppMock.mockImplementation(() => {
      throw new Error("Init failed");
    });

    const { initFirebaseFromEnv } = await import("./firebaseTelemetry");
    const db = initFirebaseFromEnv();

    expect(db).toBeNull();
    expect(initializeAppMock).toHaveBeenCalledTimes(1);
    expect(forceWebSocketsMock).not.toHaveBeenCalled();
    expect(getDatabaseMock).not.toHaveBeenCalled();

    // subsequent call with successful initialization
    initializeAppMock.mockReset();
    const mockApp = { name: "[DEFAULT]" };
    const mockDb = { app: mockApp };
    initializeAppMock.mockReturnValue(mockApp);
    getDatabaseMock.mockReturnValue(mockDb);

    const db2 = initFirebaseFromEnv();
    expect(db2).toBe(mockDb);
    expect(initializeAppMock).toHaveBeenCalledTimes(1);
    expect(forceWebSocketsMock).toHaveBeenCalledTimes(1);
    expect(getDatabaseMock).toHaveBeenCalledTimes(1);
  });
});
