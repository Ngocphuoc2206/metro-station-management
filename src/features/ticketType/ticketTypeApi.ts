import { apiClient } from "@features/httpClient/ApiClient";
import { API_ENDPOINTS, ApiResponse, withPathParam } from "@features/httpClient/apiEndpoints";
import { TicketType } from "./ticketTypeTypes";

// ── Backend response shape (theo BE spec thực tế) ─────────────────────────────
interface BackendTicketType {
  // ID — backend có thể trả về 'ticketTypeId' hoặc 'id'
  ticketTypeId?: string;
  ticketTypeID?: string;
  ticket_type_id?: string;
  ticket_typeId?: string;
  typeId?: string;
  ticketId?: string;
  uuid?: string;
  _id?: string;
  id?: string;
  Id?: string;
  ID?: string;
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

function text(value: unknown) {
  return value === undefined || value === null ? "" : String(value).trim();
}

function getTicketTypeId(b: BackendTicketType) {
  return text(
    b.ticketTypeId ??
      b.ticketTypeID ??
      b.ticket_type_id ??
      b.ticket_typeId ??
      b.typeId ??
      b.ticketId ??
      b.uuid ??
      b._id ??
      b.id ??
      b.Id ??
      b.ID,
  );
}

// ── Map Backend → UI ──────────────────────────────────────────────────────────
function mapToUI(b: BackendTicketType): TicketType {
  // Lấy ID an toàn — thử nhiều field
  const rawId = getTicketTypeId(b);

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
    code: text(b.code) || (rawId ? rawId.slice(0, 10).toUpperCase() : "UNKNOWN"),
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
    name: data.name?.trim() || undefined,
    description: data.conditions ?? "",
    price: data.price,
    validityDays: data.validityDuration,
    isActive: data.status === "active" || data.status === undefined,
  };
}

export const ticketTypeApi = {
  // ── GET /admin/ticket-types ────────────────────────────────────────────────
  getTicketTypes: async (): Promise<TicketType[]> => {
    let raw: unknown;

    try {
      const res = await apiClient.get<ApiResponse<BackendTicketType[]>>(
        API_ENDPOINTS.ticketTypes.admin
      );
      raw = res.data.results;
    } catch (error) {
      const res = await apiClient.get<ApiResponse<BackendTicketType[]>>(
        API_ENDPOINTS.ticketTypes.base
      );
      raw = res.data.results;
      console.warn("Không lấy được danh sách loại vé từ admin endpoint, dùng public endpoint thay thế.", error);
    }

    if (!Array.isArray(raw)) return [];
    return raw.map((item) => mapToUI(item as BackendTicketType));
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

  // DELETE /admin/ticket-types/{id}
  deleteTicketType: async (id: string): Promise<void> => {
    await apiClient.delete(withPathParam(API_ENDPOINTS.ticketTypes.admin, id));
  },
};
