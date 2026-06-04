import { apiClient } from "@features/httpClient/ApiClient";
import { API_ENDPOINTS } from "@features/httpClient/apiEndpoints";
import { unwrapApiResponse } from "@features/httpClient/unwrap";
import { normalizeTicketNameForBackend } from "@utils/ticketTypeName";

export type FareCalculateRequest = {
  originId: string;
  destinationId: string;
  ticketTypeName: string;
  distance: number;
};

export const fareCalcApi = {
  calculate: async (payload: FareCalculateRequest): Promise<number> => {
    const params = {
      originId: payload.originId,
      destinationId: payload.destinationId,
      ticketType: normalizeTicketNameForBackend(payload.ticketTypeName),
      distance: payload.distance,
    };

    const res = await apiClient.get(API_ENDPOINTS.fares.calculate, { params });
    return unwrapApiResponse<number>(res.data);
  },
};
