import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

export function Dashboard() {
  const [demoMsg] = useState("Welcome to PitMind Engineer Console (Demo Mode)");

  return (
    <div className="relative mx-auto flex min-h-[calc(100vh-64px)] max-w-[1600px] flex-col gap-4 px-4 py-4 lg:px-6">
      {/* Header */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
        <h1 className="text-3xl font-bold text-pit-fg mb-2">Engineer Dashboard</h1>
        <p className="text-pit-muted text-sm">{demoMsg}</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="border-white/10 bg-white/5 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-pit-muted">Current Lap</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-pit-fg">27 / 53</div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-pit-muted">P1 Gap</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-pit-accent">+0.0s</div>
            <p className="text-xs text-pit-muted mt-1">Leader</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-pit-muted">Tyre Wear</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-pit-fg">85%</div>
            <p className="text-xs text-pit-muted mt-1">Soft - 12 laps</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-pit-muted">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-emerald-400">Connected</div>
            <p className="text-xs text-pit-muted mt-1">Telemetry active</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Standings */}
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <h2 className="text-lg font-semibold text-pit-fg mb-4">Live Standings (P1-P3)</h2>
          <div className="space-y-3">
            {[
              { pos: 1, driver: "Driver A", gap: "0.0s", lap: 27 },
              { pos: 2, driver: "Driver B", gap: "+1.234s", lap: 27 },
              { pos: 3, driver: "Driver C", gap: "+3.456s", lap: 26 },
            ].map((entry) => (
              <div key={entry.pos} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 p-3">
                <div className="flex items-center gap-3">
                  <span className="h-8 w-8 rounded-full bg-pit-accent/20 flex items-center justify-center font-bold text-pit-accent">
                    P{entry.pos}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-pit-fg">{entry.driver}</p>
                    <p className="text-xs text-pit-muted">Lap {entry.lap}</p>
                  </div>
                </div>
                <p className="text-sm font-mono text-pit-fg">{entry.gap}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Strategy Note */}
        <div className="rounded-2xl border border-pit-accent/30 bg-pit-accent/10 p-6 backdrop-blur">
          <h2 className="text-lg font-semibold text-pit-fg mb-4 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-pit-accent"></span>
            Strategy Notes
          </h2>
          <div className="space-y-2 text-sm text-pit-muted">
            <p>• Soft tyres degrading - pit window LAP 30-32</p>
            <p>• No safety cars yet - plan nominal strategy</p>
            <p>• DRS open on straights - monitor gap to P2</p>
            <p>• Weather stable - no rain expected</p>
          </div>
        </div>
      </div>

      {/* Demo Note */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur text-xs text-pit-muted">
        <strong className="text-pit-fg">Demo Mode:</strong> This is a simplified engineer interface. Live data streams are connected via WebSocket at{" "}
        <code className="font-mono text-pit-accent">ws://127.0.0.1:8000/api/v1/stream/telemetry</code>
      </div>
    </div>
  );
}
