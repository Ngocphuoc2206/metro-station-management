import { apiClient } from "@features/httpClient/ApiClient";
import { API_ENDPOINTS, ApiResponse, withPathParam } from "@features/httpClient/apiEndpoints";
import { TicketType } from "./ticketTypeTypes";

// ── Backend response shape (theo BE spec thực tế) ─────────────────────────────
interface BackendTicketType {
  // ID — backend có thể trả về 'ticketTypeId' hoặc 'id'
  ticketTypeId?: string;
  id?: string;
  code?: string;
  name: string;
  // BE dùng 'description' (không phải 'conditions')
  description?: string;
  conditions?: string;
  // BE dùng 'price'
  price?: number;
  basePrice?: number;
  // BE dùng 'validityDays' (số ngày), hoặc các field cũ
  validityDays?: number;
  validityDuration?: number;
  duration?: number;
  validityUnit?: string;
  unit?: string;
  // BE dùng 'isActive' (boolean) hoặc 'status' (string)
  isActive?: boolean;
  status?: string;
  [key: string]: unknown;
}

// ── Map Backend → UI ──────────────────────────────────────────────────────────
function mapToUI(b: BackendTicketType): TicketType {
  // Lấy ID an toàn — thử nhiều field
  const rawId = b.ticketTypeId ?? b.id ?? "";

  // Tính validity: ưu tiên validityDays (BE spec), fallback về các field cũ
  const days = b.validityDays ?? b.validityDuration ?? b.duration ?? 0;

  // Status: ưu tiên isActive (BE spec), fallback về status string
  let isActive: boolean;
  if (typeof b.isActive === "boolean") {
    isActive = b.isActive;
  } else {
    isActive = b.status?.toLowerCase() === "active";
  }

  return {
    id: rawId,
    code: b.code ?? (rawId ? rawId.slice(0, 10).toUpperCase() : "UNKNOWN"),
    name: b.name ?? "(Không tên)",
    validityDuration: days,
    // Nếu validityDays > 0 → tính theo ngày, còn lại theo giờ
    validityUnit: days > 0 ? "days" : "hours",
    price: b.price ?? b.basePrice ?? 0,
    conditions: b.description ?? b.conditions ?? "",
    status: isActive ? "active" : "inactive",
  };
}

// ── Map UI → Backend payload (theo BE spec) ────────────────────────────────────
function mapToBackend(data: Partial<TicketType>): Record<string, unknown> {
  return {
    name: data.name,
    description: data.conditions ?? "",
    price: data.price,
    validityDays: data.validityDuration,
    isActive: data.status === "active" || data.status === undefined,
  };
}

export const ticketTypeApi = {
  // ── GET /ticket-types ─────────────────────────────────────────────────────
  getTicketTypes: async (): Promise<TicketType[]> => {
    const res = await apiClient.get<ApiResponse<BackendTicketType[]>>(
      API_ENDPOINTS.ticketTypes.base
    );
    // Đảm bảo results là array trước khi map
    const raw = res.data.results;
    if (!Array.isArray(raw)) return [];
    return raw.map(mapToUI);
  },

  // ── POST /admin/ticket-types ───────────────────────────────────────────────
  createTicketType: async (data: Omit<TicketType, "id">): Promise<TicketType> => {
    const res = await apiClient.post<ApiResponse<BackendTicketType>>(
      API_ENDPOINTS.ticketTypes.admin,
      mapToBackend(data)
    );
    return mapToUI(res.data.results);
  },

  // ── PUT /admin/ticket-types/{id} ──────────────────────────────────────────
  updateTicketType: async (id: string, updates: Partial<TicketType>): Promise<TicketType> => {
    const res = await apiClient.put<ApiResponse<BackendTicketType>>(
      withPathParam(API_ENDPOINTS.ticketTypes.admin, id),
      mapToBackend(updates)
    );
    return mapToUI(res.data.results);
  },

  // Không có API xóa → dùng PUT để set isActive = false
  deleteTicketType: async (id: string): Promise<void> => {
    await apiClient.put(
      withPathParam(API_ENDPOINTS.ticketTypes.admin, id),
      { isActive: false }
    );
  },
};
