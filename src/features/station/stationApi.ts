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
  latitude?: number | string | null;
  longitude?: number | string | null;
  la_titude?: number | string | null;
  long_titude?: number | string | null;
  status: "ACTIVE" | "INACTIVE" | string;
  // Backend có thể trả thêm các field khác
  [key: string]: unknown;
}

// ── Map Backend → UI ──────────────────────────────────────────────────────────
function toCoordinateString(value: unknown): string {
  if (value === null || value === undefined) return "";
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? String(numericValue) : "";
}

function mapToUI(b: BackendStation): Station {
  const lat = toCoordinateString(b.latitude ?? b.la_titude);
  const lng = toCoordinateString(b.longitude ?? b.long_titude);

  return {
    id: b.stationId,
    code: b.stationCode ?? b.stationId.slice(0, 8).toUpperCase(),
    name: b.name,
    line: (b.line as string) ?? "—",
    zone: b.address ?? b.location ?? "—",
    status: b.status?.toLowerCase() === "active" ? "active" : "inactive",
    location: lat && lng ? `${lat}, ${lng}` : "",
    lat,
    lng,
  };
}

// ── Map UI form → Backend payload ─────────────────────────────────────────────
function mapToBackend(data: Partial<Station> & { latitude?: number; longitude?: number }): Record<string, unknown> {
  // Form lưu tọa độ dạng string "lat, lng" trong field location
  // Backend cần latitude và longitude là số riêng biệt
  let latitude: number | undefined = data.latitude;
  let longitude: number | undefined = data.longitude;

  if (data.lat !== undefined) {
    latitude = parseFloat(data.lat);
  }
  if (data.lng !== undefined) {
    longitude = parseFloat(data.lng);
  }

  if (latitude === undefined && longitude === undefined && data.location) {
    const parts = data.location.split(",");
    if (parts.length === 2) {
      latitude = parseFloat(parts[0].trim());
      longitude = parseFloat(parts[1].trim());
    }
  }

  return {
    name: data.name,
    // 'zone' trong UI tương ứng với 'address' trên backend
    address: data.zone ?? data.location,
    latitude: isNaN(latitude ?? NaN) ? undefined : latitude,
    longitude: isNaN(longitude ?? NaN) ? undefined : longitude,
    // ENUM: ACTIVE | INACTIVE | MAINTENANCE
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
  // Backend PUT yêu cầu full payload, không chỉ riêng status
  toggleStatus: async (station: Station, newStatus: "active" | "inactive"): Promise<Station> => {
    const res = await apiClient.put<ApiResponse<BackendStation>>(
      withPathParam(API_ENDPOINTS.stations.admin, station.id),
      mapToBackend({ ...station, status: newStatus })
    );
    return mapToUI(res.data.results);
  },

  // ── DELETE /admin/stations/{id} (FE-19) ───────────────────────────────────
  deleteStation: async (id: string): Promise<boolean> => {
    await apiClient.delete(withPathParam(API_ENDPOINTS.stations.admin, id));
    return true;
  },
};
