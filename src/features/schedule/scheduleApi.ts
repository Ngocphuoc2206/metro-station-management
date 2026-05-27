import axios from "axios";
import { apiClient } from "@features/httpClient/ApiClient";
import { API_ENDPOINTS, withPathParam } from "@features/httpClient/apiEndpoints";
import { unwrapApiResponse } from "@features/httpClient/unwrap";
import type { ScheduleDto } from "./scheduleTypes";

const freshRequestConfig = () => ({
  params: { _: Date.now() },
  headers: {
    "Cache-Control": "no-store",
    Pragma: "no-cache",
  },
});

const normalizeSchedules = (raw: unknown): ScheduleDto[] => {
  if (!Array.isArray(raw)) return [];
  return raw.map((value) => {
    if (!value || typeof value !== "object") return null;
    const item = value as Record<string, unknown>;
    const id = String(item.id ?? "");
    const routeId = String(item.routeId ?? "");
    const stationId = String(item.stationId ?? "");
    if (!id || !routeId || !stationId) return null;
    return {
      id,
      routeId,
      stationId,
      direction: String(item.direction ?? ""),
      departureTime: String(item.departureTime ?? ""),
      arrivalTime: String(item.arrivalTime ?? ""),
      frequencyMinutes: Number(item.frequencyMinutes ?? 0),
      status: String(item.status ?? ""),
    };
  }).filter(Boolean) as ScheduleDto[];
};

export const scheduleErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const message =
      typeof error.response?.data?.message === "string"
        ? error.response.data.message
        : error.message;
    return status
      ? `API lịch trình trả về HTTP ${status}${message ? `: ${message}` : ""}.`
      : `Không kết nối được API lịch trình: ${message}.`;
  }
  return "Không thể tải dữ liệu lịch trình.";
};

export const scheduleApi = {
  list: async (): Promise<ScheduleDto[]> => {
    const res = await apiClient.get(API_ENDPOINTS.schedules.base, freshRequestConfig());
    return normalizeSchedules(unwrapApiResponse(res.data));
  },

  listByRoute: async (routeId: string): Promise<ScheduleDto[]> => {
    const path = `${withPathParam(API_ENDPOINTS.routes.base, routeId)}/schedule`;
    const res = await apiClient.get(path, freshRequestConfig());
    return normalizeSchedules(unwrapApiResponse(res.data));
  },
};
