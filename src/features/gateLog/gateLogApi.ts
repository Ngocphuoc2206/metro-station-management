import { apiClient } from "@features/httpClient/ApiClient";
import { API_ENDPOINTS, ApiResponse } from "@features/httpClient/apiEndpoints";
import { unwrapApiResponse } from "@features/httpClient/unwrap";
import type { GateAction, GateLog, GateResult } from "./gateLogTypes";

export type { GateLog };

export interface GateLogFilters {
  stationId?: string;
  gateId?: string;
  from?: string;
  to?: string;
  result?: string;
}

interface BackendGateLog {
  logId?: string;
  id?: string;
  timestamp?: string;
  scanTime?: string;
  scannedAt?: string;
  createdAt?: string;
  gateId?: string;
  gateCode?: string;
  ticketId?: string;
  ticketCode?: string;
  action?: string;
  type?: string;
  result?: string;
  status?: string;
  message?: string;
  stationId?: string;
  stationName?: string;
  station?: string;
}

function normalizeAction(raw?: string): GateAction {
  const value = (raw ?? "").toUpperCase().replace(/[\s-]/g, "_");
  return value.includes("OUT") || value.includes("EXIT") ? "TAP_OUT" : "TAP_IN";
}

function normalizeResult(raw?: string): GateResult {
  const value = (raw ?? "").toUpperCase();
  return value === "ALLOW" || value === "SUCCESS" || value === "ACCEPTED" ? "ALLOW" : "DENY";
}

function mapToUI(item: BackendGateLog): GateLog {
  const gateId = item.gateId ?? "";
  const ticketId = item.ticketId ?? "";

  return {
    id: item.logId ?? item.id ?? `${item.scannedAt ?? item.createdAt ?? Date.now()}-${ticketId}-${gateId}`,
    timestamp: item.scannedAt ?? item.timestamp ?? item.scanTime ?? item.createdAt ?? "",
    gateId,
    gateCode: item.gateCode ?? gateId,
    ticketId,
    ticketCode: item.ticketCode ?? ticketId,
    action: normalizeAction(item.action ?? item.type),
    result: normalizeResult(item.result ?? item.status),
    message: item.message,
    stationId: item.stationId ?? "",
    stationName: item.stationName ?? item.station ?? "",
  };
}

export const gateLogApi = {
  getLogs: async (filters: GateLogFilters = {}): Promise<GateLog[]> => {
    const params = new URLSearchParams();
    if (filters.stationId) params.append("stationId", filters.stationId);
    if (filters.gateId) params.append("gateId", filters.gateId);
    if (filters.from) params.append("from", filters.from);
    if (filters.to) params.append("to", filters.to);
    if (filters.result) params.append("result", filters.result);

    const url = params.toString()
      ? `${API_ENDPOINTS.gates.logs}?${params.toString()}`
      : API_ENDPOINTS.gates.logs;

    const res = await apiClient.get<ApiResponse<BackendGateLog[]> | BackendGateLog[]>(url);
    const logs = unwrapApiResponse<BackendGateLog[]>(res.data);
    return Array.isArray(logs) ? logs.map(mapToUI) : [];
  },
};
