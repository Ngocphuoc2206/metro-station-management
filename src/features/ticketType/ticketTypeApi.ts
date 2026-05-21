import { apiClient } from "@features/httpClient/ApiClient";
import { API_ENDPOINTS, ApiResponse, withPathParam } from "@features/httpClient/apiEndpoints";
import { TicketType } from "./ticketTypeTypes";

// ── Backend response shape ────────────────────────────────────────────────────
interface BackendTicketType {
  ticketTypeId: string;
  code?: string;
  name: string;
  validityDuration?: number;
  duration?: number;
  validityUnit?: string;
  unit?: string;
  price: number;
  basePrice?: number;
  conditions?: string;
  description?: string;
  status?: string;
  [key: string]: unknown;
}

// ── Map Backend → UI ──────────────────────────────────────────────────────────
function mapToUI(b: BackendTicketType): TicketType {
  const unit = (b.validityUnit ?? b.unit ?? "hours").toLowerCase();
  return {
    id: b.ticketTypeId,
    code: b.code ?? b.ticketTypeId.slice(0, 10).toUpperCase(),
    name: b.name,
    validityDuration: b.validityDuration ?? b.duration ?? 0,
    validityUnit: unit.includes("day") ? "days" : "hours",
    price: b.price ?? b.basePrice ?? 0,
    conditions: b.conditions ?? b.description ?? "",
    status: b.status?.toLowerCase() === "active" ? "active" : "inactive",
  };
}

// ── Map UI → Backend payload ──────────────────────────────────────────────────
function mapToBackend(data: Partial<TicketType>): Record<string, unknown> {
  return {
    code: data.code,
    name: data.name,
    validityDuration: data.validityDuration,
    validityUnit: data.validityUnit,
    price: data.price,
    conditions: data.conditions,
    status: data.status?.toUpperCase(),
  };
}

export const ticketTypeApi = {
  // ── GET /ticket-types (FE-21) ─────────────────────────────────────────────
  getTicketTypes: async (): Promise<TicketType[]> => {
    const res = await apiClient.get<ApiResponse<BackendTicketType[]>>(
      API_ENDPOINTS.ticketTypes.base
    );
    return (res.data.results ?? []).map(mapToUI);
  },

  // ── POST /admin/ticket-types (FE-21) ──────────────────────────────────────
  createTicketType: async (data: Omit<TicketType, "id">): Promise<TicketType> => {
    const res = await apiClient.post<ApiResponse<BackendTicketType>>(
      API_ENDPOINTS.ticketTypes.admin,
      mapToBackend(data)
    );
    return mapToUI(res.data.results);
  },

  // ── PUT /admin/ticket-types/{id} (FE-21) ──────────────────────────────────
  updateTicketType: async (id: string, updates: Partial<TicketType>): Promise<TicketType> => {
    const res = await apiClient.put<ApiResponse<BackendTicketType>>(
      withPathParam(API_ENDPOINTS.ticketTypes.admin, id),
      mapToBackend(updates)
    );
    return mapToUI(res.data.results);
  },

  // Backend chưa có API xóa ticket type, dùng update status thay thế
  deleteTicketType: async (id: string): Promise<void> => {
    await apiClient.put(
      withPathParam(API_ENDPOINTS.ticketTypes.admin, id),
      { status: "INACTIVE" }
    );
  },
};
