import { apiClient } from "@features/httpClient/ApiClient";
import { API_ENDPOINTS, withPathParam } from "@features/httpClient/apiEndpoints";
import { unwrapApiResponse } from "@features/httpClient/unwrap";
import type { RouteDto, StationDto, TicketTypeDto } from "./publicTypes";

const USE_MOCK_PUBLIC = process.env.NEXT_PUBLIC_USE_MOCK_PUBLIC === "true";

const coerceList = <T>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];
  return [];
};

const optionalNumber = (value: unknown) => {
  const parsed = Number(value);
  return value !== undefined && value !== null && Number.isFinite(parsed)
    ? parsed
    : undefined;
};

const normalizeStations = (raw: unknown): StationDto[] => {
  const list = coerceList<unknown>(raw);
  return list
    .map((item) => {
      if (typeof item === "string") {
        return { id: item, name: item };
      }

      if (item && typeof item === "object") {
        const anyItem = item as Record<string, unknown>;
        const id = String(anyItem.id ?? anyItem.stationId ?? anyItem.code ?? "");
        const name = String(anyItem.name ?? anyItem.stationName ?? anyItem.title ?? id);
        if (!id) return null;
        return {
          id,
          name,
          code: anyItem.code ? String(anyItem.code) : undefined,
          latitude: optionalNumber(anyItem.latitude ?? anyItem.lat ?? anyItem.la_titude),
          longitude: optionalNumber(anyItem.longitude ?? anyItem.lng ?? anyItem.lon ?? anyItem.long_titude),
        };
      }

      return null;
    })
    .filter(Boolean) as StationDto[];
};

const normalizeRoutes = (raw: unknown): RouteDto[] => {
  const list = coerceList<unknown>(raw);
  return list
    .map((item) => {
      if (item && typeof item === "object") {
        const anyItem = item as Record<string, unknown>;
        const id = String(anyItem.id ?? anyItem.routeId ?? "");
        const name = String(anyItem.name ?? anyItem.routeName ?? id);
        if (!id) return null;
        return {
          id,
          name,
          description: anyItem.description ? String(anyItem.description) : undefined,
          color: anyItem.color ? String(anyItem.color) : undefined,
        };
      }
      return null;
    })
    .filter(Boolean) as RouteDto[];
};

const normalizeTicketTypes = (raw: unknown): TicketTypeDto[] => {
  const list = coerceList<unknown>(raw);
  return list
    .map((item) => {
      if (item && typeof item === "object") {
        const anyItem = item as Record<string, unknown>;
        const id = String(anyItem.id ?? anyItem.Id ?? anyItem.ticketTypeId ?? anyItem.code ?? "");
        const name = String(anyItem.name ?? anyItem.ticketTypeName ?? id);
        if (!id) return null;
        return {
          id,
          code: anyItem.code ? String(anyItem.code) : undefined,
          name,
          description: anyItem.description ? String(anyItem.description) : undefined,
          conditions: anyItem.conditions ? String(anyItem.conditions) : undefined,
          price: typeof anyItem.price === "number" ? anyItem.price : undefined,
          validityDays:
            typeof anyItem.validityDays === "number"
              ? anyItem.validityDays
              : undefined,
          isActive:
            typeof anyItem.isActive === "boolean"
              ? anyItem.isActive
              : undefined,
          status: anyItem.status ? String(anyItem.status) : undefined,
          validityDuration:
            typeof anyItem.validityDuration === "number"
              ? anyItem.validityDuration
              : undefined,
          validityUnit: anyItem.validityUnit ? String(anyItem.validityUnit) : undefined,
        };
      }
      return null;
    })
    .filter(Boolean) as TicketTypeDto[];
};

export const publicApi = {
  getStations: async (): Promise<StationDto[]> => {
    const res = await apiClient.get(API_ENDPOINTS.stations.base);
    return normalizeStations(unwrapApiResponse(res.data));
  },

  getRoutes: async (): Promise<RouteDto[]> => {
    if (USE_MOCK_PUBLIC) {
      return [
        { id: "route-1", name: "Line 01" },
        { id: "route-2", name: "Line 02" },
      ];
    }

    const res = await apiClient.get(API_ENDPOINTS.routes.base);
    return normalizeRoutes(unwrapApiResponse(res.data));
  },

  getRouteById: async (routeId: string): Promise<RouteDto> => {
    const res = await apiClient.get(withPathParam(API_ENDPOINTS.routes.base, routeId));
    const data = unwrapApiResponse<RouteDto>(res.data);
    return data;
  },

  getTicketTypes: async (): Promise<TicketTypeDto[]> => {
    const res = await apiClient.get(API_ENDPOINTS.ticketTypes.base);
    return normalizeTicketTypes(unwrapApiResponse(res.data));
  },
};
