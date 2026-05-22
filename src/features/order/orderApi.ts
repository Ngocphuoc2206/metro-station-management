import { apiClient } from "@features/httpClient/ApiClient";
import { API_ENDPOINTS, withPathParam } from "@features/httpClient/apiEndpoints";
import { unwrapApiResponse } from "@features/httpClient/unwrap";
import type {
  CreateOrderRequest,
  OrderDto,
  OrderPreviewRequest,
  OrderPreviewResult,
} from "./orderTypes";

export const orderApi = {
  preview: async (payload: OrderPreviewRequest): Promise<OrderPreviewResult> => {
    const res = await apiClient.post(API_ENDPOINTS.orders.preview, payload);
    return unwrapApiResponse<OrderPreviewResult>(res.data);
  },

  create: async (payload: CreateOrderRequest): Promise<OrderDto> => {
    const res = await apiClient.post(API_ENDPOINTS.orders.base, payload);
    return unwrapApiResponse<OrderDto>(res.data);
  },

  getById: async (id: string): Promise<OrderDto> => {
    const res = await apiClient.get(withPathParam(API_ENDPOINTS.orders.base, id));
    return unwrapApiResponse<OrderDto>(res.data);
  },

  getStatus: async (params?: { status?: string }): Promise<unknown> => {
    const res = await apiClient.get(API_ENDPOINTS.orders.status, { params });
    return unwrapApiResponse(res.data);
  },
};
