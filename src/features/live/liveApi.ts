import axios from "axios";
import { apiClient } from "@features/httpClient/ApiClient";
import { API_ENDPOINTS } from "@features/httpClient/apiEndpoints";
import { unwrapApiResponse } from "@features/httpClient/unwrap";
import type { LiveStationStatusDto, LiveTrainDto } from "./liveTypes";

const text = (value: unknown) =>
  value === undefined || value === null ? "" : String(value);

const optionalNumber = (value: unknown) => {
  const parsed = Number(value);
  return value !== undefined && value !== null && Number.isFinite(parsed)
    ? parsed
    : undefined;
};

const list = (value: unknown) => (Array.isArray(value) ? value : []);

const normalizeTrains = (raw: unknown): LiveTrainDto[] =>
  list(raw)
    .map((value) => {
      if (!value || typeof value !== "object") return null;
      const item = value as Record<string, unknown>;
      const id = text(item.id ?? item.trainId ?? item.code ?? item.trainCode);
      if (!id) return null;

      return {
        id,
        code: text(item.code ?? item.trainCode ?? id),
        routeId: text(item.routeId) || undefined,
        direction: text(item.direction),
        nextStationId: text(item.nextStationId ?? item.stationId) || undefined,
        nextStationName: text(
          item.nextStationName ?? item.nextStation ?? item.stationName ?? item.stationId,
        ),
        eta: text(item.eta ?? item.estimatedArrivalTime ?? item.arrivalTime),
        occupancy: optionalNumber(item.occupancy ?? item.occupancyRate ?? item.loadPercent) ?? 0,
        status: text(item.status),
        x: optionalNumber(item.x ?? item.positionX),
        y: optionalNumber(item.y ?? item.positionY),
      };
    })
    .filter(Boolean) as LiveTrainDto[];

const normalizeStations = (raw: unknown): LiveStationStatusDto[] =>
  list(raw)
    .map((value) => {
      if (!value || typeof value !== "object") return null;
      const item = value as Record<string, unknown>;
      const id = text(item.id ?? item.stationId ?? item.code);
      if (!id) return null;

      return {
        id,
        name: text(item.name ?? item.stationName ?? id),
        status: text(item.status ?? item.operatingStatus),
        x: optionalNumber(item.x ?? item.positionX),
        y: optionalNumber(item.y ?? item.positionY),
      };
    })
    .filter(Boolean) as LiveStationStatusDto[];

export const liveErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const message =
      typeof error.response?.data?.message === "string"
        ? error.response.data.message
        : error.message;
    return status
      ? `API live trả về HTTP ${status}${message ? `: ${message}` : ""}.`
      : `Không kết nối được API live: ${message}.`;
  }
  return "Không thể tải dữ liệu vận hành trực tuyến.";
};

export const liveApi = {
  getTrains: async (routeId?: string): Promise<LiveTrainDto[]> => {
    const res = await apiClient.get(API_ENDPOINTS.live.trains, {
      params: routeId ? { routeId } : undefined,
    });
    return normalizeTrains(unwrapApiResponse(res.data));
  },

  getStationStatuses: async (): Promise<LiveStationStatusDto[]> => {
    const res = await apiClient.get(API_ENDPOINTS.live.stationStatus);
    return normalizeStations(unwrapApiResponse(res.data));
  },
};
