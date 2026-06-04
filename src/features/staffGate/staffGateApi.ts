import { apiClient } from "@features/httpClient/ApiClient";
import { API_ENDPOINTS, withPathParam } from "@features/httpClient/apiEndpoints";
import { unwrapApiResponse } from "@features/httpClient/unwrap";
import type { GateResponse, GateScanLogResponse, GateScanResponse, ScanTicketRequest, UpdateGateStatusRequest } from "./staffGateTypes";

export type GateScanLogFilters = {
  stationId?: string;
  gateId?: string;
  from?: string;
  to?: string;
  result?: "ALLOW" | "DENY";
};

type BackendGate = Partial<GateResponse> & {
  id?: string;
  code?: string;
  deviceName?: string;
  direction?: string;
};

function isGateDevice(item: BackendGate) {
  const rawType = `${item.type ?? ""} ${item.deviceType ?? ""} ${item.gateCode ?? ""} ${item.deviceCode ?? ""}`.toUpperCase();
  return rawType.includes("GATE") || rawType.includes("CỔNG") || rawType.includes("CONG");
}

function mapGate(item: BackendGate): GateResponse {
  const gateId = item.gateId ?? item.id ?? item.deviceId ?? "";
  const gateCode = item.gateCode ?? item.deviceCode ?? item.code ?? gateId;

  return {
    gateId,
    gateCode,
    name: item.name ?? item.deviceName ?? gateCode,
    stationId: item.stationId ?? "",
    stationName: item.stationName ?? "",
    action: item.action ?? item.directionMode ?? item.direction ?? "",
    status: item.status ?? "",
    deviceId: item.deviceId,
    deviceCode: item.deviceCode,
    type: item.type,
    deviceType: item.deviceType,
    directionMode: item.directionMode ?? item.direction,
  };
}

export const staffGateApi = {
  getGates: async (): Promise<GateResponse[]> => {
    const res = await apiClient.get(API_ENDPOINTS.gates.staff);
    const gates = unwrapApiResponse<BackendGate[]>(res.data);
    const gateItems = Array.isArray(gates) ? gates.map(mapGate).filter((item) => item.gateId) : [];

    if (gateItems.length > 0) {
      return gateItems;
    }

    const deviceRes = await apiClient.get(API_ENDPOINTS.devices.staff);
    const devices = unwrapApiResponse<BackendGate[]>(deviceRes.data);
    return Array.isArray(devices)
      ? devices.filter(isGateDevice).map(mapGate).filter((item) => item.gateId)
      : [];
  },
  scan: async (payload: ScanTicketRequest): Promise<GateScanResponse> => {
    const res = await apiClient.post(API_ENDPOINTS.gates.scan, payload);
    return unwrapApiResponse<GateScanResponse>(res.data);
  },
  getLogs: async (params: GateScanLogFilters = {}): Promise<GateScanLogResponse[]> => {
    const res = await apiClient.get(API_ENDPOINTS.gates.logs, { params });
    const logs = unwrapApiResponse<GateScanLogResponse[]>(res.data);
    return Array.isArray(logs) ? logs : [];
  },
  updateStatus: async (id: string, payload: UpdateGateStatusRequest): Promise<GateResponse> => {
    const res = await apiClient.put(`${withPathParam(API_ENDPOINTS.gates.staff, id)}/status`, payload);
    return unwrapApiResponse<GateResponse>(res.data);
  },
};
