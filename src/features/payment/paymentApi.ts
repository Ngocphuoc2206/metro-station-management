import { apiClient } from "@features/httpClient/ApiClient";
import { API_ENDPOINTS, withPathParam } from "@features/httpClient/apiEndpoints";
import { unwrapApiResponse } from "@features/httpClient/unwrap";
import type {
  PaymentCallbackRequest,
  PaymentDto,
  PaymentInitRequest,
  PaymentInitResult,
} from "./paymentTypes";

export const paymentApi = {
  init: async (payload: PaymentInitRequest): Promise<PaymentInitResult> => {
    const res = await apiClient.post(API_ENDPOINTS.payments.init, payload);
    return unwrapApiResponse<PaymentInitResult>(res.data);
  },

  callback: async (payload: PaymentCallbackRequest): Promise<PaymentDto> => {
    const res = await apiClient.put(API_ENDPOINTS.payments.callback, undefined, {
      params: payload,
    });
    return unwrapApiResponse<PaymentDto>(res.data);
  },

  getById: async (id: string): Promise<PaymentDto> => {
    const res = await apiClient.get(withPathParam(API_ENDPOINTS.payments.base, id));
    return unwrapApiResponse<PaymentDto>(res.data);
  },
};
