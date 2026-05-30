import { apiClient } from "@features/httpClient/ApiClient";
import { API_ENDPOINTS, withPathParam } from "@features/httpClient/apiEndpoints";
import { unwrapApiResponse } from "@features/httpClient/unwrap";
import type {
  CreateOrderRequest,
  OrderDto,
  OrderPreviewRequest,
  OrderPreviewResult,
} from "./orderTypes";

const optionalNumber = (value: unknown) => {
  const parsed = Number(value);
  return value !== undefined && value !== null && Number.isFinite(parsed)
    ? parsed
    : undefined;
};

const normalizePreview = (value: unknown): OrderPreviewResult => {
  const raw =
    value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const items = Array.isArray(raw.items) ? raw.items : [];
  const itemSubtotal = items.reduce((total, value) => {
    const item =
      value && typeof value === "object" ? (value as Record<string, unknown>) : {};
    const subTotal = optionalNumber(item.subTotal ?? item.subtotal);
    if (subTotal !== undefined) return total + subTotal;

    const quantity = optionalNumber(item.quantity) ?? 0;
    const unitPrice = optionalNumber(item.unitprice ?? item.unitPrice) ?? 0;
    return total + quantity * unitPrice;
  }, 0);
  const serviceFee = optionalNumber(raw.serviceFee) ?? 0;
  const total = optionalNumber(raw.totalAmount ?? raw.total) ?? itemSubtotal + serviceFee;
  const subtotal =
    optionalNumber(raw.subtotal ?? raw.subTotal) ??
    (items.length > 0 ? itemSubtotal : total - serviceFee);

  return {
    subtotal,
    serviceFee,
    total,
    currency: typeof raw.currency === "string" ? raw.currency : undefined,
    items,
  };
};

const normalizeOrder = (value: unknown): OrderDto => {
  const raw =
    value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const id = String(raw.orderId ?? raw.id ?? "");

  return {
    id,
    orderId: id || undefined,
    status: typeof raw.status === "string" ? raw.status : undefined,
    total: optionalNumber(raw.totalAmount ?? raw.total),
    totalAmount: optionalNumber(raw.totalAmount ?? raw.total),
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : undefined,
    items: Array.isArray(raw.items) ? raw.items : undefined,
    data: raw,
  };
};

export const orderApi = {
  preview: async (payload: OrderPreviewRequest): Promise<OrderPreviewResult> => {
    const res = await apiClient.post(API_ENDPOINTS.orders.preview, payload);
    return normalizePreview(unwrapApiResponse(res.data));
  },

  create: async (payload: CreateOrderRequest): Promise<OrderDto> => {
    const res = await apiClient.post(API_ENDPOINTS.orders.base, payload);
    return normalizeOrder(unwrapApiResponse(res.data));
  },

  getById: async (id: string): Promise<OrderDto> => {
    const res = await apiClient.get(withPathParam(API_ENDPOINTS.orders.base, id));
    return normalizeOrder(unwrapApiResponse(res.data));
  },

  getStatus: async (params?: { status?: string }): Promise<unknown> => {
    const res = await apiClient.get(API_ENDPOINTS.orders.status, { params });
    return unwrapApiResponse(res.data);
  },
};
