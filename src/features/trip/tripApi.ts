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

const object = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const list = (value: unknown): unknown[] => {
  if (Array.isArray(value)) return value;

  const container = object(value);
  const nested =
    container.content ??
    container.items ??
    container.data ??
    container.results ??
    container.trips ??
    container.records;
  return Array.isArray(nested) ? nested : [];
};

const firstText = (...values: unknown[]) => {
  for (const value of values) {
    const resolved = text(value);
    if (resolved) return resolved;
  }
  return "";
};

const normalizeTrip = (raw: unknown): TripDto | null => {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  const originStation = object(
    item.originStation ?? item.fromStation ?? item.checkInStation ?? item.entryStation,
  );
  const destinationStation = object(
    item.destinationStation ?? item.toStation ?? item.checkOutStation ?? item.exitStation,
  );
  const ticket = object(item.ticket);
  const checkInAt = firstText(
    item.checkInAt,
    item.checkInTime,
    item.entryTime,
    item.enteredAt,
    item.startedAt,
    item.checkinTime,
    item.tapInAt,
    item.createdAt,
  );
  const checkOutAt = firstText(
    item.checkOutAt,
    item.checkOutTime,
    item.exitTime,
    item.exitedAt,
    item.completedAt,
    item.checkoutTime,
    item.tapOutAt,
  );
  const ticketId = firstText(item.ticketId, ticket.id);
  const ticketCode = firstText(item.ticketCode, ticket.code, ticket.ticketCode, ticketId);
  const fallbackId = ticketCode || checkInAt || checkOutAt
    ? `${ticketCode}-${checkInAt}-${checkOutAt}`
    : "";
  const id = firstText(item.id, item.tripId, item.transactionId, fallbackId);
  if (!id) return null;
  return {
    id,
    ticketId,
    ticketCode,
    originStationName: firstText(
      item.originStationName,
      item.entryStationName,
      item.checkInStationName,
      item.fromStationName,
      item.originName,
      item.from,
      originStation.name,
      originStation.stationName,
    ),
    destinationStationName: firstText(
      item.destinationStationName,
      item.exitStationName,
      item.checkOutStationName,
      item.toStationName,
      item.destinationName,
      item.to,
      destinationStation.name,
      destinationStation.stationName,
    ),
    checkInAt: checkInAt || undefined,
    checkOutAt: checkOutAt || undefined,
    status: firstText(item.status, item.tripStatus, item.result),
    fare: optionalNumber(item.fare ?? item.price ?? item.amount ?? item.totalFare),
    entryGate: firstText(item.entryGate, item.entryGateCode, item.gateInCode, item.checkInGateCode) || undefined,
    exitGate: firstText(item.exitGate, item.exitGateCode, item.gateOutCode, item.checkOutGateCode) || undefined,
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
    const res = await apiClient.get(API_ENDPOINTS.my.trips, {
      params: {
        ...query,
        page: query.page + 1,
      },
    });
    const raw = unwrapApiResponse<unknown>(res.data);
    const container = raw && typeof raw === "object" && !Array.isArray(raw)
      ? raw as Record<string, unknown>
      : {};
    const rawItems = list(raw);
    const items = rawItems.map(normalizeTrip).filter(Boolean) as TripDto[];
    const total = optionalNumber(
      container.totalElements ?? container.total ?? container.totalItems ?? container.totalRecords,
    ) ?? items.length;
    const limit = optionalNumber(container.size ?? container.limit ?? container.pageSize) ?? query.limit;
    const springPage = optionalNumber(container.number);
    const apiPage = optionalNumber(container.page ?? container.currentPage);
    const page = springPage ?? (apiPage === undefined ? query.page : Math.max(0, apiPage - 1));
    return {
      items,
      page,
      limit,
      total,
      totalPages: optionalNumber(container.totalPages) ?? Math.max(1, Math.ceil(total / limit)),
    };
  },
};
