import { apiClient } from "@features/httpClient/ApiClient";
import { API_ENDPOINTS } from "@features/httpClient/apiEndpoints";
import { unwrapApiResponse } from "@features/httpClient/unwrap";

export type FareCalculateRequest = {
  /** Backend spec: originId */
  originId?: string;
  /** Backend spec: destinationId */
  destinationId?: string;
  /** Backend spec: ticketType */
  ticketType?: string;

  /** Backward-compat (existing FE code): fromStationId -> originId */
  fromStationId?: string;
  /** Backward-compat (existing FE code): toStationId -> destinationId */
  toStationId?: string;
  /** Backward-compat (existing FE code): ticketTypeId -> ticketType */
  ticketTypeId?: string;

  // Not specified in backend doc for /fares/calculate, but kept for potential future extension.
  passengerCount?: number;
  isRoundTrip?: boolean;
  travelDate?: string;
};

export type FareCalculateResult = {
  total: number;
  subtotal?: number;
  serviceFee?: number;
  currency?: string;
  breakdown?: unknown;
};

export const fareCalcApi = {
  calculate: async (payload: FareCalculateRequest): Promise<FareCalculateResult> => {
    const params = {
      originId: payload.originId ?? payload.fromStationId,
      destinationId: payload.destinationId ?? payload.toStationId,
      ticketType: payload.ticketType ?? payload.ticketTypeId,
    };

    const res = await apiClient.get(API_ENDPOINTS.fares.calculate, { params });
    return unwrapApiResponse<FareCalculateResult>(res.data);
  },
};
