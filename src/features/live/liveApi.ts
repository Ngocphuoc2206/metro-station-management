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

const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const list = (value: unknown) => {
  if (Array.isArray(value)) return value;

  const container = record(value);
  const nested = container.content ?? container.items ?? container.data;
  return Array.isArray(nested) ? nested : [];
};

const etaText = (item: Record<string, unknown>) => {
  const eta = item.eta ?? item.estimatedArrivalTime ?? item.arrivalTime;
  if (eta !== undefined && eta !== null) return text(eta);

  const minutes = optionalNumber(
    item.etaMinutes ?? item.estimatedArrivalMinutes ?? item.minutesToNextStation,
  );
  return minutes === undefined ? "" : `${minutes} phút`;
};

const normalizeTrains = (raw: unknown): LiveTrainDto[] =>
  list(raw)
    .map((value) => {
      if (!value || typeof value !== "object") return null;
      const item = value as Record<string, unknown>;
      const position = record(item.position ?? item.location);
      const id = text(
        item.id ?? item.trainId ?? item.code ?? item.trainCode ?? item.trainNumber,
      );
      if (!id) return null;

      return {
        id,
        code: text(item.code ?? item.trainCode ?? item.trainNumber ?? id),
        routeId: text(item.routeId) || undefined,
        direction: text(item.direction ?? item.directionName),
        nextStationId:
          text(item.nextStationId ?? item.currentStationId ?? item.stationId) ||
          undefined,
        nextStationName: text(
          item.nextStationName ??
            item.currentStationName ??
            item.nextStation ??
            item.stationName ??
            item.stationId,
        ),
        eta: etaText(item),
        occupancy:
          optionalNumber(
            item.occupancy ??
              item.occupancyRate ??
              item.occupancyPercent ??
              item.loadPercent,
          ) ?? 0,
        status: text(item.status ?? item.trainStatus ?? item.operatingStatus),
        x: optionalNumber(item.x ?? item.positionX ?? position.x ?? position.positionX),
        y: optionalNumber(item.y ?? item.positionY ?? position.y ?? position.positionY),
      };
    })
    .filter(Boolean) as LiveTrainDto[];

const normalizeStations = (raw: unknown): LiveStationStatusDto[] =>
  list(raw)
    .map((value) => {
      if (!value || typeof value !== "object") return null;
      const item = value as Record<string, unknown>;
      const position = record(item.position ?? item.location);
      const id = text(item.id ?? item.stationId ?? item.code);
      if (!id) return null;

      return {
        id,
        stationId: id,
        name: text(item.name ?? item.stationName ?? id),
        status: text(item.status ?? item.stationStatus ?? item.operatingStatus),
        congestionLevel: optionalNumber(
          item.congestionLevel ?? item.crowdLevel ?? item.occupancy,
        ),
        message: text(item.message ?? item.alertMessage) || undefined,
        updatedAt: text(item.updatedAt ?? item.lastUpdatedAt ?? item.timestamp) || undefined,
        x: optionalNumber(item.x ?? item.positionX ?? position.x ?? position.positionX),
        y: optionalNumber(item.y ?? item.positionY ?? position.y ?? position.positionY),
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
