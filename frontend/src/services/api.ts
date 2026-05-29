/**
 * API Service for PitMind Frontend
 *
 * This module provides type-safe API functions for interacting with the backend.
 * All functions use proper TypeScript types from types/api.ts to ensure type safety.
 *
 * @module services/api
 */

import type {
  TelemetryPayload,
  StrategyRecommendation,
  StrategyCommitRequest,
  StrategyCommitResponse,
  ChatMessage,
  ChatRequest,
  ChatResponse,
  DebriefResponse,
  FastF1Request,
  DriverCompareRequest,
  DriverCompareResponse,
  FanPredictRequest,
  FanPredictResponse,
  FanStatusResponse,
  AuditHistoryResponse,
  AuditHistoryParams,
} from "../types/api";

// Re-export types for backward compatibility
export type {
  LapPoint,
  TelemetryPayload,
  StrategyScores,
  ConfidenceDecomposition,
  StrategyRecommendation,
  StrategyChecklist,
  StrategyCommitRequest,
  StrategyCommitResponse,
  ChatMessage,
  ChatResponse,
  DebriefResponse,
  FastF1Request,
  FanPredictRequest,
  FanPredictResponse,
  FanStatusResponse,
  DriverCompareRequest,
  DriverCompareResponse,
  AuditHistoryResponse,
  AuditHistoryParams,
} from "../types/api";

const BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "";

/**
 * Helper function to build headers with optional authentication
 */
function buildHeaders(token?: string, includeContentType = true): Record<string, string> {
  const headers: Record<string, string> = {};
  if (includeContentType) {
    headers["Content-Type"] = "application/json";
  }
  const authToken = token || (import.meta.env.DEV ? "dev_mock" : undefined);
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }
  return headers;
}

/**
 * Helper function to handle API errors
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

// ============================================================================
// Strategy API Functions
// ============================================================================

/**
 * Generate strategy recommendation from telemetry data
 *
 * @param payload - Telemetry data for analysis
 * @param token - Optional authentication token
 * @returns Strategy recommendation with confidence scores
 */
export async function postRecommend(
  payload: TelemetryPayload,
  token?: string,
): Promise<StrategyRecommendation> {
  const response = await fetch(`${BASE}/api/v1/strategy/recommend`, {
    method: "POST",
    headers: buildHeaders(token),
    body: JSON.stringify(payload),
  });
  return handleResponse<StrategyRecommendation>(response);
}

/**
 * Upload telemetry file (CSV or JSON) for analysis
 *
 * @param file - Telemetry file to upload
 * @param token - Optional authentication token
 * @returns Parsed telemetry payload
 */
export async function uploadTelemetry(file: File, token?: string): Promise<TelemetryPayload> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${BASE}/api/v1/strategy/telemetry/upload`, {
    method: "POST",
    headers: buildHeaders(token, false),
    body: formData,
  });
  return handleResponse<TelemetryPayload>(response);
}

/**
 * Load telemetry data from FastF1 API
 *
 * @param request - FastF1 session parameters
 * @param token - Optional authentication token
 * @returns Telemetry data from FastF1
 */
export async function postLoadFastF1(
  request: FastF1Request,
  token?: string,
): Promise<TelemetryPayload> {
  const response = await fetch(`${BASE}/api/v1/strategy/fastf1/load`, {
    method: "POST",
    headers: buildHeaders(token),
    body: JSON.stringify(request),
  });
  return handleResponse<TelemetryPayload>(response);
}

/**
 * Commit a strategy decision to the audit log
 *
 * @param request - Strategy commit payload with checklist
 * @param token - Optional authentication token
 * @returns Commit confirmation with audit ID
 */
export async function postCommitStrategy(
  request: StrategyCommitRequest,
  token?: string,
): Promise<StrategyCommitResponse> {
  const response = await fetch(`${BASE}/api/v1/strategy/commit`, {
    method: "POST",
    headers: buildHeaders(token),
    body: JSON.stringify(request),
  });
  return handleResponse<StrategyCommitResponse>(response);
}

// ============================================================================
// Chat & Commentary API Functions
// ============================================================================

/**
 * Send chat message to AI copilot for strategy explanation
 *
 * @param messages - Chat message history
 * @param telemetryContext - Optional telemetry context for the chat
 * @param token - Optional authentication token
 * @returns AI response message
 */
export async function postChat(
  messages: ChatMessage[],
  telemetryContext?: Record<string, unknown>,
  token?: string,
): Promise<ChatResponse> {
  const request: ChatRequest = {
    messages,
    telemetry_context: telemetryContext ?? null,
  };

  const response = await fetch(`${BASE}/api/v1/chat/explain`, {
    method: "POST",
    headers: buildHeaders(token),
    body: JSON.stringify(request),
  });
  return handleResponse<ChatResponse>(response);
}

/**
 * Upload post-race debrief file for AI analysis
 *
 * @param file - Debrief file (PDF, CSV, JSON, or TXT)
 * @param token - Optional authentication token
 * @returns AI-generated debrief report in markdown
 */
export async function uploadDebrief(file: File, token?: string): Promise<DebriefResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${BASE}/api/v1/debrief/upload`, {
    method: "POST",
    headers: buildHeaders(token, false),
    body: formData,
  });
  return handleResponse<DebriefResponse>(response);
}

// ============================================================================
// Fan Engagement API Functions
// ============================================================================

/**
 * Submit fan prediction for what-if scenario
 *
 * @param request - Fan prediction parameters
 * @returns Prediction narrative and outcome
 */
export async function postFanPredict(request: FanPredictRequest): Promise<FanPredictResponse> {
  const response = await fetch(`${BASE}/api/v1/fan/predict`, {
    method: "POST",
    headers: buildHeaders(undefined),
    body: JSON.stringify(request),
  });
  return handleResponse<FanPredictResponse>(response);
}
