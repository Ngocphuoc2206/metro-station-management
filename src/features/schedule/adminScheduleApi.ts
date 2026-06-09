import axios from "axios";
import { apiClient } from "@features/httpClient/ApiClient";
import { API_ENDPOINTS, withPathParam } from "@features/httpClient/apiEndpoints";
import { unwrapApiResponse } from "@features/httpClient/unwrap";
import type { ScheduleDto } from "./scheduleTypes";

export type ScheduleDirection = "OUTBOUND" | "INBOUND";
export type ScheduleStatus = "ACTIVE" | "DELAYED" | "INACTIVE";

export type SchedulePayload = {
  routeId: string;
  stationId: string;
  direction: ScheduleDirection;
  departureTime: string;
  arrivalTime: string;
  frequencyMinutes: number;
  status: ScheduleStatus;
};

const text = (value: unknown) =>
  value === undefined || value === null ? "" : String(value);

const normalizeSchedule = (value: unknown): ScheduleDto | null => {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  const id = text(item.id);
  const routeId = text(item.routeId);
  const stationId = text(item.stationId);
  if (!id || !routeId || !stationId) return null;

  return {
    id,
    routeId,
    stationId,
    direction: text(item.direction),
    departureTime: text(item.departureTime),
    arrivalTime: text(item.arrivalTime),
    frequencyMinutes: Number(item.frequencyMinutes ?? 0),
    status: text(item.status),
  };
};

const normalizeScheduleList = (raw: unknown): ScheduleDto[] => {
  const source = Array.isArray(raw) ? raw : [];
  return source.map(normalizeSchedule).filter(Boolean) as ScheduleDto[];
};

export const adminScheduleErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const message =
      typeof error.response?.data?.message === "string"
        ? error.response.data.message
        : error.message;
    return status
      ? `API lịch tàu trả về HTTP ${status}${message ? `: ${message}` : ""}.`
      : `Không kết nối được API lịch tàu: ${message}.`;
  }
  return "Không thể xử lý lịch tàu.";
};

export const adminScheduleApi = {
  list: async (): Promise<ScheduleDto[]> => {
    const res = await apiClient.get(API_ENDPOINTS.schedules.base, {
      params: { _: Date.now() },
      headers: { "Cache-Control": "no-store", Pragma: "no-cache" },
    });
    return normalizeScheduleList(unwrapApiResponse(res.data));
  },

  create: async (payload: SchedulePayload): Promise<ScheduleDto> => {
    const res = await apiClient.post(API_ENDPOINTS.schedules.admin, payload);
    const schedule = normalizeSchedule(unwrapApiResponse(res.data));
    if (!schedule) throw new Error("API không trả về lịch tàu hợp lệ.");
    return schedule;
  },

  update: async (id: string, payload: SchedulePayload): Promise<ScheduleDto> => {
    const res = await apiClient.put(
      withPathParam(API_ENDPOINTS.schedules.admin, id),
      payload,
    );
    const schedule = normalizeSchedule(unwrapApiResponse(res.data));
    if (!schedule) throw new Error("API không trả về lịch tàu hợp lệ.");
    return schedule;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(withPathParam(API_ENDPOINTS.schedules.admin, id));
  },
};
