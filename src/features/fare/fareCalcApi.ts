import { apiClient } from "@features/httpClient/ApiClient";
import { API_ENDPOINTS } from "@features/httpClient/apiEndpoints";
import { unwrapApiResponse } from "@features/httpClient/unwrap";

export type FareCalculateRequest = {
  originId: string;
  destinationId: string;
  ticketType: string;
};

export const fareCalcApi = {
  calculate: async (payload: FareCalculateRequest): Promise<number> => {
    const params = {
      originId: payload.originId,
      destinationId: payload.destinationId,
      ticketType: payload.ticketType,
    };

    const res = await apiClient.get(API_ENDPOINTS.fares.calculate, { params });
    return unwrapApiResponse<number>(res.data);
  },
};
