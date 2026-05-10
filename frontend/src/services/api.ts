const BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "";

export type LapPoint = {
  lap: number;
  lap_time_s?: number | null;
  sector1_s?: number | null;
  sector2_s?: number | null;
  sector3_s?: number | null;
  tyre_wear_pct?: number | null;
  tyre_compound?: string | null;
  fuel_kg?: number | null;
  gap_ahead_s?: number | null;
  gap_behind_s?: number | null;
};

export type TelemetryPayload = {
  circuit: string;
  session_label: string;
  driver: string;
  laps: LapPoint[];
};

export type StrategyScores = {
  pit_urgency: number;
  sc_probability_next_3_laps: number;
  overtake_risk: number;
  recommended_window_laps: [number, number];
};

export type StrategyRecommendation = {
  action: string;
  pit_this_lap: boolean;
  suggested_compound: string;
  scores: StrategyScores;
  structured_reasons: string[];
  explanation: string;
  evidence: string[];
  assumptions: string[];
  confidence: number;
  alternative: string;
  pipeline_steps: string[];
};

export async function postRecommend(payload: TelemetryPayload, token?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}/api/v1/strategy/recommend`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<StrategyRecommendation>;
}

export async function postChat(messages: { role: "user" | "assistant"; content: string }[], ctx?: object, token?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}/api/v1/chat/explain`, {
    method: "POST",
    headers,
    body: JSON.stringify({ messages, telemetry_context: ctx }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{ reply: string }>;
}

export async function postCompare(a: TelemetryPayload, b: TelemetryPayload, token?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}/api/v1/compare/drivers`, {
    method: "POST",
    headers,
    body: JSON.stringify({ driver_a: a, driver_b: b }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{ chart_series: Record<string, unknown>; narrative: string }>;
}

export async function uploadTelemetry(file: File, token?: string): Promise<TelemetryPayload> {
  const fd = new FormData();
  fd.append("file", file);
  
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}/api/v1/telemetry/upload`, {
    method: "POST",
    headers,
    body: fd,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function uploadDebrief(file: File, token?: string): Promise<{ report_markdown: string; source_note: string }> {
  const fd = new FormData();
  fd.append("file", file);

  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}/api/v1/debrief/upload`, {
    method: "POST",
    headers,
    body: fd,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
