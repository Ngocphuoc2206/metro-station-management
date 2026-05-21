import { apiClient } from "@features/httpClient/ApiClient";
import { API_ENDPOINTS, ApiResponse, withPathParam } from "@features/httpClient/apiEndpoints";
import { Station, StationFilters, PaginatedResult } from "./stationTypes";

// ── Backend response shape ────────────────────────────────────────────────────
interface BackendStation {
  stationId: string;
  stationCode?: string;
  name: string;
  address?: string;
  location?: string;
  status: "ACTIVE" | "INACTIVE" | string;
  // Backend có thể trả thêm các field khác
  [key: string]: unknown;
}

// ── Map Backend → UI ──────────────────────────────────────────────────────────
function mapToUI(b: BackendStation): Station {
  return {
    id: b.stationId,
    code: b.stationCode ?? b.stationId.slice(0, 8).toUpperCase(),
    name: b.name,
    line: (b.line as string) ?? "—",
    zone: b.address ?? b.location ?? "—",
    status: b.status?.toLowerCase() === "active" ? "active" : "inactive",
    location: b.address ?? b.location ?? "",
  };
}

// ── Map UI form → Backend payload ─────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapToBackend(data: Partial<Station>): Record<string, unknown> {
  return {
    name: data.name,
    address: data.zone ?? data.location,
    location: data.location ?? data.zone,
    status: data.status?.toUpperCase(),
  };
}

export const stationApi = {
  // ── GET /stations (FE-19) ──────────────────────────────────────────────────
  getStations: async (
    filters: StationFilters,
    _page: number = 1,
    _limit: number = 10
  ): Promise<PaginatedResult<Station>> => {
    const res = await apiClient.get<ApiResponse<BackendStation[]>>(
      API_ENDPOINTS.stations.base
    );
    let data = (res.data.results ?? []).map(mapToUI);

    // Client-side filtering (vì backend GET /stations chưa có query params filter)
    if (filters.search) {
      const q = filters.search.toLowerCase();
      data = data.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.code.toLowerCase().includes(q) ||
          s.zone.toLowerCase().includes(q)
      );
    }
    if (filters.status) {
      data = data.filter((s) => s.status === filters.status);
    }
    if (filters.line) {
      data = data.filter((s) => s.line === filters.line);
    }

    const total = data.length;
    const start = (_page - 1) * _limit;
    return { data: data.slice(start, start + _limit), total, page: _page, limit: _limit };
  },

  // ── POST /admin/stations (FE-19) ───────────────────────────────────────────
  createStation: async (station: Omit<Station, "id" | "code">): Promise<Station> => {
    const res = await apiClient.post<ApiResponse<BackendStation>>(
      API_ENDPOINTS.stations.admin,
      mapToBackend(station)
    );
    return mapToUI(res.data.results);
  },

  // ── PUT /admin/stations/{id} (FE-19) ──────────────────────────────────────
  updateStation: async (id: string, updates: Partial<Station>): Promise<Station> => {
    const res = await apiClient.put<ApiResponse<BackendStation>>(
      withPathParam(API_ENDPOINTS.stations.admin, id),
      mapToBackend(updates)
    );
    return mapToUI(res.data.results);
  },

  // ── PATCH status via PUT /admin/stations/{id} ──────────────────────────────
  toggleStatus: async (id: string, newStatus: "active" | "inactive"): Promise<Station> => {
    const res = await apiClient.put<ApiResponse<BackendStation>>(
      withPathParam(API_ENDPOINTS.stations.admin, id),
      { status: newStatus.toUpperCase() }
    );
    return mapToUI(res.data.results);
  },

  // ── DELETE /admin/stations/{id} (FE-19) ───────────────────────────────────
  deleteStation: async (id: string): Promise<boolean> => {
    await apiClient.delete(withPathParam(API_ENDPOINTS.stations.admin, id));
    return true;
  },
};
