import { apiClient } from "@features/httpClient/ApiClient";
import { API_ENDPOINTS, ApiResponse, withPathParam } from "@features/httpClient/apiEndpoints";

// ── Types (GateLog) ───────────────────────────────────────────────────────────
export interface GateLog {
  id: string;
  timestamp: string;
  gateId: string;
  ticketId: string;
  action: "enter" | "exit" | string;
  result: "success" | "rejected" | string;
  ticketType: string;
  passengerName?: string;
  station?: string;
  rejectionReason?: string;
  deviceFirmware?: string;
  transactionMs?: number;
}

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

function mapToUI(b: BackendGateLog): GateLog {
  const rawResult = b.result ?? b.status ?? "success";
  const result = rawResult.toLowerCase().includes("fail") ||
    rawResult.toLowerCase().includes("reject") ||
    rawResult.toLowerCase().includes("invalid")
    ? "rejected"
    : "success";

  return {
    id: b.logId ?? b.id ?? `LOG-${Date.now()}`,
    timestamp: b.timestamp ?? b.scanTime ?? b.createdAt ?? "",
    gateId: b.gateId ?? b.gate ?? "—",
    ticketId: b.ticketId ?? b.ticketCode ?? "—",
    action: b.action ?? b.type ?? "enter",
    result,
    ticketType: b.ticketType ?? "qr",
    passengerName: b.passengerName ?? b.userName,
    station: b.stationName ?? b.station,
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
