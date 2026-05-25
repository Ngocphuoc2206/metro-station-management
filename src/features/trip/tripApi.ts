import axios from "axios";
import { apiClient } from "@features/httpClient/ApiClient";
import { API_ENDPOINTS } from "@features/httpClient/apiEndpoints";
import { unwrapApiResponse } from "@features/httpClient/unwrap";
import type { TripDto, TripPage, TripQuery } from "./tripTypes";

const text = (value: unknown) =>
  value === undefined || value === null ? "" : String(value);

const optionalNumber = (value: unknown) => {
  const parsed = Number(value);
  return value !== undefined && value !== null && Number.isFinite(parsed)
    ? parsed
    : undefined;
};

const normalizeTrip = (raw: unknown): TripDto | null => {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  const id = text(item.id ?? item.tripId);
  if (!id) return null;
  return {
    id,
    ticketId: text(item.ticketId),
    ticketCode: text(item.ticketCode ?? item.ticketId),
    originStationName: text(item.originStationName ?? item.fromStationName ?? item.originName),
    destinationStationName: text(item.destinationStationName ?? item.toStationName ?? item.destinationName),
    checkInAt: text(item.checkInAt ?? item.entryTime ?? item.startedAt) || undefined,
    checkOutAt: text(item.checkOutAt ?? item.exitTime ?? item.completedAt) || undefined,
    status: text(item.status),
    fare: optionalNumber(item.fare ?? item.price ?? item.amount),
    entryGate: text(item.entryGate ?? item.entryGateCode) || undefined,
    exitGate: text(item.exitGate ?? item.exitGateCode) || undefined,
  };
};

export const tripErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const message =
      typeof error.response?.data?.message === "string"
        ? error.response.data.message
        : error.message;
    return `Không thể tải lịch sử chuyến${message ? `: ${message}` : ""}`;
  }
  return "Không thể tải lịch sử chuyến.";
};

export const tripApi = {
  list: async (query: TripQuery): Promise<TripPage> => {
    const res = await apiClient.get(API_ENDPOINTS.my.trips, { params: query });
    const raw = unwrapApiResponse<unknown>(res.data);
    const object = raw && typeof raw === "object" && !Array.isArray(raw)
      ? raw as Record<string, unknown>
      : {};
    const rawItems = Array.isArray(raw)
      ? raw
      : Array.isArray(object.content)
        ? object.content
        : Array.isArray(object.items)
          ? object.items
          : Array.isArray(object.data)
            ? object.data
            : [];
    const items = rawItems.map(normalizeTrip).filter(Boolean) as TripDto[];
    const total = optionalNumber(object.totalElements ?? object.total ?? object.totalItems) ?? items.length;
    const limit = optionalNumber(object.size ?? object.limit) ?? query.limit;
    const page = optionalNumber(object.number ?? object.page) ?? query.page;
    return {
      items,
      page,
      limit,
      total,
      totalPages: optionalNumber(object.totalPages) ?? Math.max(1, Math.ceil(total / limit)),
    };
  },
};
