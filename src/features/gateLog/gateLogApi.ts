import { apiClient } from "@features/httpClient/ApiClient";
import { API_ENDPOINTS, ApiResponse, withPathParam } from "@features/httpClient/apiEndpoints";
import type { GateLog, GateAction, GateResult, TicketType } from "./gateLogTypes";

// Re-export for convenience
export type { GateLog };

export interface GateLogFilters {
  stationId?: string;
  gateId?: string;
  from?: string;
  to?: string;
  result?: string;
}

// ── Backend response shape ────────────────────────────────────────────────────
interface BackendGateLog {
  logId?: string;
  id?: string;
  timestamp?: string;
  scanTime?: string;
  createdAt?: string;
  gateId?: string;
  gate?: string;
  ticketId?: string;
  ticketCode?: string;
  action?: string;
  type?: string;
  result?: string;
  status?: string;
  ticketType?: string;
  passengerName?: string;
  userName?: string;
  stationName?: string;
  station?: string;
  rejectionReason?: string;
  reason?: string;
  firmwareVersion?: string;
  processingTime?: number;
  [key: string]: unknown;
}

function normalizeAction(raw?: string): GateAction {
  const v = (raw ?? "").toLowerCase();
  return v.includes("exit") || v.includes("out") ? "exit" : "enter";
}

function normalizeResult(raw?: string): GateResult {
  const v = (raw ?? "").toLowerCase();
  return v.includes("fail") || v.includes("reject") || v.includes("invalid")
    ? "rejected"
    : "success";
}

function normalizeTicketType(raw?: string): TicketType {
  const v = (raw ?? "").toLowerCase();
  if (v.includes("nfc")) return "nfc";
  if (v.includes("month") || v.includes("thang")) return "monthly";
  if (v.includes("day") || v.includes("ngay")) return "daily";
  return "qr";
}

function mapToUI(b: BackendGateLog): GateLog {
  return {
    id: b.logId ?? b.id ?? `LOG-${Date.now()}`,
    timestamp: b.timestamp ?? b.scanTime ?? b.createdAt ?? "",
    gateId: b.gateId ?? b.gate ?? "—",
    ticketId: b.ticketId ?? b.ticketCode ?? "—",
    action: normalizeAction(b.action ?? b.type),
    result: normalizeResult(b.result ?? b.status),
    ticketType: normalizeTicketType(b.ticketType),
    passengerName: b.passengerName ?? b.userName,
    station: b.stationName ?? b.station ?? "—",
    rejectionReason: b.rejectionReason ?? b.reason,
    deviceFirmware: b.firmwareVersion,
    transactionMs: b.processingTime,
  };
}

export const gateLogApi = {
  // ── GET /staff/gates/logs (FE-35) ─────────────────────────────────────────
  getLogs: async (filters: GateLogFilters = {}): Promise<GateLog[]> => {
    const params = new URLSearchParams();
    if (filters.stationId) params.append("stationId", filters.stationId);
    if (filters.gateId) params.append("gateId", filters.gateId);
    if (filters.from) params.append("from", filters.from);
    if (filters.to) params.append("to", filters.to);

    const url = params.toString()
      ? `${API_ENDPOINTS.gates.logs}?${params.toString()}`
      : API_ENDPOINTS.gates.logs;

    const res = await apiClient.get<ApiResponse<BackendGateLog[]>>(url);
    return (res.data.results ?? []).map(mapToUI);
  },
};
