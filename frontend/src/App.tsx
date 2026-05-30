import React, { Suspense, useEffect, useRef, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useOptionalAuthUser } from "./hooks/useOptionalAuthUser";
import { RoleProvider } from "./contexts/RoleContext";
import { StreamProvider } from "./contexts/StreamContext";
import { PanelStateProvider } from "./contexts/PanelStateContext";
import { PageShell } from "./components/layout/PageShell";
import { Skeleton } from "./components/ui/skeleton";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";

// ── OFFLINE DETECTION BANNER ─────────────────────────────────────────────────
function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        background: "rgba(232,0,45,0.95)",
        color: "#fff",
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        textAlign: "center",
        padding: "8px 16px",
        backdropFilter: "blur(8px)",
      }}
    >
      ⚠ NO NETWORK CONNECTION — TELEMETRY DATA MAY BE STALE
    </div>
  );
}


const Dashboard = React.lazy(() =>
  import("./pages/Dashboard").then((module) => ({ default: module.Dashboard })),
);
const FanMode = React.lazy(() =>
  import("./pages/FanMode").then((module) => ({ default: module.FanMode })),
);
const Login = React.lazy(() =>
  import("./pages/Login").then((module) => ({ default: module.Login })),
);
const Strategy = React.lazy(() =>
  import("./pages/Strategy").then((module) => ({ default: module.Strategy })),
);
const Telemetry = React.lazy(() =>
  import("./pages/Telemetry").then((module) => ({ default: module.Telemetry })),
);
const Landing = React.lazy(() =>
  import("./pages/Landing").then((module) => ({ default: module.Landing })),
);

function PageLoader({ label }: { label: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-10">
      <div
        className="w-full max-w-md p-6 text-center"
        style={{ background: "var(--carbon-light)", border: "1px solid var(--border)" }}
      >
        <Skeleton className="mx-auto h-3 w-24" />
        <Skeleton className="mx-auto mt-4 h-9 w-48" />
        <p
          className="mt-4 text-sm"
          style={{ fontFamily: "'IBM Plex Mono', monospace", color: "var(--text-secondary)" }}
        >
          {label}
        </p>
      </div>
    </div>
  );
}

function RequireAuth({ children }: { children: React.ReactElement }) {
  const { user, loading } = useOptionalAuthUser();

  if (loading) {
    return (
      <div
        className="flex h-screen items-center justify-center"
        style={{
          background: "var(--carbon)",
          color: "var(--text-secondary)",
          fontFamily: "'IBM Plex Mono', monospace",
        }}
      >
        Checking authentication...
      </div>
    );
  }

  // Only bypass authentication in development when explicitly enabled
  const bypassAuth = import.meta.env.VITE_BYPASS_AUTH === "true" && import.meta.env.DEV;

  if (!user && !bypassAuth) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// ── SPEED LINES CANVAS ───────────────────────────────────────────────────
function SpeedLinesCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const lines = Array.from({ length: 60 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      len: 40 + Math.random() * 120,
      speed: 8 + Math.random() * 20,
      opacity: 0.05 + Math.random() * 0.12,
      width: 0.5 + Math.random() * 1,
    }));

    let animId: number;
    let isVisible = true;

    function draw() {
      if (!canvas || !ctx || !isVisible || document.hidden) {
        animId = requestAnimationFrame(draw);
        return;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      lines.forEach((l) => {
        ctx.strokeStyle = `rgba(232,0,45,${l.opacity})`;
        ctx.lineWidth = l.width;
        ctx.beginPath();
        ctx.moveTo(l.x, l.y);
        ctx.lineTo(l.x + l.len, l.y);
        ctx.stroke();
        l.x += l.speed;
        if (l.x > canvas.width + 200) {
          l.x = -200;
          l.y = Math.random() * canvas.height;
          l.speed = 8 + Math.random() * 20;
          l.len = 40 + Math.random() * 120;
        }
      });
      animId = requestAnimationFrame(draw);
    }

    // Pause when canvas is off-screen
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0 },
    );
    observer.observe(canvas);

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animId);
      observer.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="pm-speed-canvas"
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        opacity: 0.35,
      }}
    />
  );
}

// ── CUSTOM CURSOR ─────────────────────────────────────────────────────────
function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const ring = useRef({ x: 0, y: 0 });
  const animRef = useRef<number>(0);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMove);

    const onEnter = () => {
      if (ringRef.current) {
        ringRef.current.style.transform = "translate(-50%,-50%) scale(2)";
        ringRef.current.style.borderColor = "var(--f1-red)";
      }
    };
    const onLeave = () => {
      if (ringRef.current) {
        ringRef.current.style.transform = "translate(-50%,-50%) scale(1)";
        ringRef.current.style.borderColor = "var(--f1-red-glow)";
      }
    };

    const interactables = document.querySelectorAll(
      "button, a, [role='button'], .pm-chip, .pm-nav-item, .pm-standing-row, .pm-strategy-card, .pm-tl-item, input",
    );
    interactables.forEach((el) => {
      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
    });

    function animate() {
      ring.current.x += (mouse.current.x - ring.current.x) * 0.15;
      ring.current.y += (mouse.current.y - ring.current.y) * 0.15;

      if (dotRef.current) {
        dotRef.current.style.left = mouse.current.x + "px";
        dotRef.current.style.top = mouse.current.y + "px";
      }
      if (ringRef.current) {
        ringRef.current.style.left = ring.current.x + "px";
        ringRef.current.style.top = ring.current.y + "px";
      }
      animRef.current = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="pm-cursor" aria-hidden="true" />
      <div ref={ringRef} className="pm-cursor-ring" aria-hidden="true" />
    </>
  );
}

// Mobile responsive utility
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile;
}

export default function App() {
  const apiBase = import.meta.env.VITE_API_BASE_URL;
  const defaultWsUrl =
    import.meta.env.VITE_WS_URL ||
    (apiBase
      ? apiBase.replace(/^http/, "ws") + "/api/v1/stream/telemetry"
      : (window.location.protocol === "https:" ? "wss://" : "ws://") +
        window.location.host +
        "/api/v1/stream/telemetry");

  return (
    <BrowserRouter>
      {/* Global overlays */}
      <OfflineBanner />
      <SpeedLinesCanvas />
      <CustomCursor />

      {/* App content above canvas */}
      <PanelStateProvider>
        <div style={{ position: "relative", zIndex: 10, minHeight: "100vh" }}>
          <Routes>
            <Route
              path="/login"
              element={
                <ErrorBoundary>
                  <Suspense fallback={<PageLoader label="Loading login..." />}>
                    <Login />
                  </Suspense>
                </ErrorBoundary>
              }
            />

            {/* Fan Mode is unauthenticated */}
            <Route
              path="/fan"
              element={
                <ErrorBoundary>
                  <PageShell>
                    <Suspense fallback={<PageLoader label="Loading fan view..." />}>
                      <FanMode />
                    </Suspense>
                  </PageShell>
                </ErrorBoundary>
              }
            />

            {/* Dashboard is restricted to authenticated engineers */}
            <Route
              path="/dashboard"
              element={
                <ErrorBoundary>
                  <RequireAuth>
                    <StreamProvider wsUrl={defaultWsUrl}>
                      <RoleProvider>
                        <PageShell>
                          <Suspense fallback={<PageLoader label="Loading engineer console..." />}>
                            <Dashboard />
                          </Suspense>
                        </PageShell>
                      </RoleProvider>
                    </StreamProvider>
                  </RequireAuth>
                </ErrorBoundary>
              }
            />

            <Route
              path="/strategy"
              element={
                <ErrorBoundary>
                  <RequireAuth>
                    <StreamProvider wsUrl={defaultWsUrl}>
                      <RoleProvider>
                        <PageShell>
                          <Suspense fallback={<PageLoader label="Loading Strategy Workspace..." />}>
                            <Strategy />
                          </Suspense>
                        </PageShell>
                      </RoleProvider>
                    </StreamProvider>
                  </RequireAuth>
                </ErrorBoundary>
              }
            />

            <Route
              path="/telemetry"
              element={
                <ErrorBoundary>
                  <RequireAuth>
                    <StreamProvider wsUrl={defaultWsUrl}>
                      <RoleProvider>
                        <PageShell>
                          <Suspense fallback={<PageLoader label="Loading Telemetry..." />}>
                            <Telemetry />
                          </Suspense>
                        </PageShell>
                      </RoleProvider>
                    </StreamProvider>
                  </RequireAuth>
                </ErrorBoundary>
              }
            />

            {/* Copilot is an alias for the Dashboard view in this version */}
            <Route
              path="/copilot"
              element={
                <ErrorBoundary>
                  <RequireAuth>
                    <StreamProvider wsUrl={defaultWsUrl}>
                      <RoleProvider>
                        <PageShell>
                          <Suspense fallback={<PageLoader label="Loading Copilot workspace..." />}>
                            <Dashboard />
                          </Suspense>
                        </PageShell>
                      </RoleProvider>
                    </StreamProvider>
                  </RequireAuth>
                </ErrorBoundary>
              }
            />

            {/* Default route */}
            <Route
              path="/"
              element={
                <ErrorBoundary>
                  <PageShell>
                    <Suspense fallback={<PageLoader label="Loading PitMind..." />}>
                      <Landing />
                    </Suspense>
                  </PageShell>
                </ErrorBoundary>
              }
            />
          </Routes>
        </div>
      </PanelStateProvider>
    </BrowserRouter>
  );
}
