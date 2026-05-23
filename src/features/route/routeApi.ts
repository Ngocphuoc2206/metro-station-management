import { apiClient } from "@features/httpClient/ApiClient";
import { API_ENDPOINTS, ApiResponse, withPathParam } from "@features/httpClient/apiEndpoints";
import { Route, RouteStation } from "./routeTypes";

// ── Backend response shapes ───────────────────────────────────────────────────
interface BackendRouteStation {
  id?: string;
  stationId: string;
  stationName?: string;
  name?: string;
  description?: string;
  sequenceOrder?: number;
  order?: number;
}

interface BackendRoute {
  routeId: string;
  name: string;
  description?: string;
  color?: string;
  status?: string;
  startTime?: string;
  endTime?: string;
  headwayMinutes?: number;
  frequency?: number;
  stations?: BackendRouteStation[];
  stationCount?: number;
  [key: string]: unknown;
}

// ── Map Backend → UI ──────────────────────────────────────────────────────────
function mapStationToUI(s: BackendRouteStation, idx: number): RouteStation {
  return {
    id: s.id ?? `rs-${s.stationId}-${idx}`,
    stationId: s.stationId,
    stationName: s.stationName ?? s.name ?? "Ga không tên",
    stationDetail: s.description ?? "",
    sequenceOrder: s.sequenceOrder ?? s.order ?? idx + 1,
  };
}

function mapToUI(b: BackendRoute): Route {
  const stations = (b.stations ?? []).map(mapStationToUI);
  return {
    id: b.routeId,
    name: b.name,
    description: b.description ?? "",
    color: b.color ?? "#3b82f6",
    status: normalizeStatus(b.status),
    stationsCount: b.stationCount ?? stations.length,
    startTime: b.startTime ?? "05:00",
    endTime: b.endTime ?? "23:00",
    headwayMinutes: b.headwayMinutes ?? b.frequency ?? 10,
    stations,
  };
}

function normalizeStatus(s?: string): "active" | "inactive" | "maintenance" {
  const v = s?.toUpperCase() ?? "";
  if (v.includes("ACTIVE") || v === "OPERATING") return "active";
  if (v.includes("MAINT")) return "maintenance";
  return "inactive";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapToBackend(data: Partial<Route>): Record<string, unknown> {
  return {
    name: data.name,
    description: data.description,
    color: data.color,
    status: data.status?.toUpperCase(),
    startTime: data.startTime,
    endTime: data.endTime,
    headwayMinutes: data.headwayMinutes,
    stations: data.stations?.map((s, i) => ({
      stationId: s.stationId,
      sequenceOrder: s.sequenceOrder ?? i + 1,
    })),
  };
}

export const routeApi = {
  // ── GET /routes (FE-22) ───────────────────────────────────────────────────
  getRoutes: async (): Promise<Route[]> => {
    const res = await apiClient.get<ApiResponse<BackendRoute[]>>(
      API_ENDPOINTS.routes.base
    );
    return (res.data.results ?? []).map(mapToUI);
  },

  // ── GET /routes/{id} (FE-22) ──────────────────────────────────────────────
  getRouteById: async (id: string): Promise<Route> => {
    const res = await apiClient.get<ApiResponse<BackendRoute>>(
      withPathParam(API_ENDPOINTS.routes.base, id)
    );
    return mapToUI(res.data.results);
  },

  // ── POST /routes/admin (FE-22) ────────────────────────────────────────────
  createRoute: async (data: Omit<Route, "id" | "stationsCount" | "stations">): Promise<Route> => {
    const res = await apiClient.post<ApiResponse<BackendRoute>>(
      API_ENDPOINTS.routes.admin,
      mapToBackend(data)
    );
    return mapToUI(res.data.results);
  },

  // ── PUT /routes/admin/{id} (FE-22) ────────────────────────────────────────
  updateRoute: async (id: string, updates: Partial<Route>): Promise<Route> => {
    const res = await apiClient.put<ApiResponse<BackendRoute>>(
      withPathParam(API_ENDPOINTS.routes.admin, id),
      mapToBackend(updates)
    );
    return mapToUI(res.data.results);
  },
};
