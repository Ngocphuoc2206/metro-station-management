import { apiClient } from "@features/httpClient/ApiClient";
import { API_ENDPOINTS } from "@features/httpClient/apiEndpoints";
import { unwrapApiResponse } from "@features/httpClient/unwrap";
import type { GateScanLogResponse, ScanTicketRequest } from "./staffGateTypes";

export const staffGateApi = {
  scan: async (payload: ScanTicketRequest): Promise<GateScanLogResponse> => {
    const res = await apiClient.post(API_ENDPOINTS.gates.scan, payload);
    return unwrapApiResponse<GateScanLogResponse>(res.data);
  },
};
