import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "./lib/firebase";
import { PageShell } from "./components/layout/PageShell";
import { Dashboard } from "./pages/Dashboard";
import { FanMode } from "./pages/FanMode";
import { Login } from "./pages/Login";

function RequireAuth({ children }: { children: JSX.Element }) {
  const [user, loading] = useAuthState(auth);

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
        
        {/* Default route */}
        <Route path="/" element={<Navigate to="/fan" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
