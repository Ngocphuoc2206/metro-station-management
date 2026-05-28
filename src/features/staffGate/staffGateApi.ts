import { apiClient } from "@features/httpClient/ApiClient";
import { API_ENDPOINTS } from "@features/httpClient/apiEndpoints";
import { unwrapApiResponse } from "@features/httpClient/unwrap";
import type { GateScanLogResponse, GateScanResponse, ScanTicketRequest } from "./staffGateTypes";

export type GateScanLogFilters = {
  stationId?: string;
  gateId?: string;
  from?: string;
  to?: string;
  result?: "ACCEPTED" | "REJECTED";
};

export const staffGateApi = {
  scan: async (payload: ScanTicketRequest): Promise<GateScanResponse> => {
    const res = await apiClient.post(API_ENDPOINTS.gates.scan, payload);
    return unwrapApiResponse<GateScanResponse>(res.data);
  },
  getLogs: async (params: GateScanLogFilters = {}): Promise<GateScanLogResponse[]> => {
    const res = await apiClient.get(API_ENDPOINTS.gates.logs, { params });
    const logs = unwrapApiResponse<GateScanLogResponse[]>(res.data);
    return Array.isArray(logs) ? logs : [];
  },
};
