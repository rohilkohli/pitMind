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

export async function postRecommend(payload: TelemetryPayload) {
  const res = await fetch(`${BASE}/api/v1/strategy/recommend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<Record<string, unknown>>;
}

export async function postChat(messages: { role: "user" | "assistant"; content: string }[], ctx?: object) {
  const res = await fetch(`${BASE}/api/v1/chat/explain`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, telemetry_context: ctx }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{ reply: string }>;
}

export async function postCompare(a: TelemetryPayload, b: TelemetryPayload) {
  const res = await fetch(`${BASE}/api/v1/compare/drivers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ driver_a: a, driver_b: b }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{ chart_series: Record<string, unknown>; narrative: string }>;
}

export async function uploadTelemetry(file: File): Promise<TelemetryPayload> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${BASE}/api/v1/telemetry/upload`, {
    method: "POST",
    body: fd,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function uploadDebrief(file: File): Promise<{ report_markdown: string; source_note: string }> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${BASE}/api/v1/debrief/upload`, {
    method: "POST",
    body: fd,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
