import { apiClient } from "@features/httpClient/ApiClient";
import { API_ENDPOINTS } from "@features/httpClient/apiEndpoints";
import { unwrapApiResponse } from "@features/httpClient/unwrap";
import type { ScanTicketRequest, ScanTicketResult } from "./staffGateTypes";

export const staffGateApi = {
  scan: async (payload: ScanTicketRequest): Promise<ScanTicketResult> => {
    const res = await apiClient.post(API_ENDPOINTS.gates.scan, payload);
    return unwrapApiResponse<ScanTicketResult>(res.data);
  },
};
