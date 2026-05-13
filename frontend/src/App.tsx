import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useOptionalAuthUser } from "./hooks/useOptionalAuthUser";
import { RoleProvider } from "./contexts/RoleContext";
import { StreamProvider } from "./contexts/StreamContext";
import { PageShell } from "./components/layout/PageShell";
import { Skeleton } from "./components/ui/skeleton";

const Dashboard = React.lazy(() => import("./pages/Dashboard").then((module) => ({ default: module.Dashboard })));
const FanMode = React.lazy(() => import("./pages/FanMode").then((module) => ({ default: module.FanMode })));
const Login = React.lazy(() => import("./pages/Login").then((module) => ({ default: module.Login })));

function PageLoader({ label }: { label: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-6 text-center shadow-[0_18px_48px_rgba(0,0,0,0.25)] backdrop-blur">
        <Skeleton className="mx-auto h-3 w-24" />
        <Skeleton className="mx-auto mt-4 h-9 w-48" />
        <p className="mt-4 text-sm text-f1-muted">{label}</p>
      </div>
    </div>
  );
}

function RequireAuth({ children }: { children: React.ReactElement }) {
  const { user, loading } = useOptionalAuthUser();

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-f1-black text-f1-muted">Checking authentication...</div>;
  }

  // Bypass auth for local log checking
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <Suspense fallback={<PageLoader label="Loading login..." />}>
              <Login />
            </Suspense>
          }
        />
        
        {/* Fan Mode is unauthenticated */}
        <Route
          path="/fan"
          element={
            <PageShell>
              <Suspense fallback={<PageLoader label="Loading fan view..." />}>
                <FanMode />
              </Suspense>
            </PageShell>
          }
        />
        
        {/* Dashboard is restricted to authenticated engineers */}
        <Route 
          path="/dashboard" 
          element={
            <RequireAuth>
              <StreamProvider wsUrl="ws://127.0.0.1:8000/api/v1/stream/telemetry">
                <RoleProvider>
                  <PageShell>
                    <Suspense fallback={<PageLoader label="Loading engineer console..." />}>
                      <Dashboard />
                    </Suspense>
                  </PageShell>
                </RoleProvider>
              </StreamProvider>
            </RequireAuth>
          } 
        />
        
        {/* Copilot is an alias for the Dashboard view in this version */}
        <Route 
          path="/copilot" 
          element={
            <RequireAuth>
              <StreamProvider wsUrl="ws://127.0.0.1:8000/api/v1/stream/telemetry">
                <RoleProvider>
                  <PageShell>
                    <Suspense fallback={<PageLoader label="Loading Copilot workspace..." />}>
                      <Dashboard />
                    </Suspense>
                  </PageShell>
                </RoleProvider>
              </StreamProvider>
            </RequireAuth>
          } 
        />
        
        {/* Default route */}
        <Route path="/" element={<Navigate to="/fan" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
