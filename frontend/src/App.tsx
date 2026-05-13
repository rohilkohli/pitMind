import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useOptionalAuthUser } from "./hooks/useOptionalAuthUser";
import { PageShell } from "./components/layout/PageShell";
import { Dashboard } from "./pages/Dashboard";
import { FanMode } from "./pages/FanMode";
import { Login } from "./pages/Login";

function RequireAuth({ children }: { children: React.ReactElement }) {
  const { user, loading } = useOptionalAuthUser();

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-carbon text-pit-muted">Checking authentication...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Fan Mode is unauthenticated */}
        <Route path="/fan" element={<PageShell><FanMode /></PageShell>} />
        
        {/* Dashboard is restricted to authenticated engineers */}
        <Route 
          path="/dashboard" 
          element={
            <RequireAuth>
              <PageShell>
                <Dashboard />
              </PageShell>
            </RequireAuth>
          } 
        />
        
        {/* Copilot is an alias for the Dashboard view in this version */}
        <Route 
          path="/copilot" 
          element={
            <RequireAuth>
              <PageShell>
                <Dashboard />
              </PageShell>
            </RequireAuth>
          } 
        />
        
        {/* Default route */}
        <Route path="/" element={<Navigate to="/fan" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
