import axios from "axios";
import { apiClient } from "@features/httpClient/ApiClient";
import { API_ENDPOINTS, withPathParam } from "@features/httpClient/apiEndpoints";
import { unwrapApiResponse } from "@features/httpClient/unwrap";
import type { MyTicketDto, QrTokenResult, TicketHistoryRow } from "./myTicketTypes";

const text = (value: unknown) =>
  value === undefined || value === null ? "" : String(value);

const optionalNumber = (value: unknown) => {
  const parsed = Number(value);
  return value !== undefined && value !== null && Number.isFinite(parsed)
    ? parsed
    : undefined;
};

const list = (raw: unknown): unknown[] => {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    const object = raw as Record<string, unknown>;
    if (Array.isArray(object.content)) return object.content;
    if (Array.isArray(object.items)) return object.items;
  }
  return [];
};

const normalizeTicket = (raw: unknown): MyTicketDto | null => {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  const id = text(item.id ?? item.ticketId);
  if (!id) return null;
  const type = item.ticketType && typeof item.ticketType === "object"
    ? item.ticketType as Record<string, unknown>
    : {};
  const order = item.order && typeof item.order === "object"
    ? item.order as Record<string, unknown>
    : {};
  return {
    id,
    code: text(item.code ?? item.ticketCode ?? id),
    status: text(item.status),
    ticketTypeId: text(item.ticketTypeId ?? type.id) || undefined,
    ticketTypeName: text(item.ticketTypeName ?? type.name ?? item.ticketTypeCode ?? type.code),
    originStationName: text(item.originStationName ?? item.fromStationName) || undefined,
    destinationStationName: text(item.destinationStationName ?? item.toStationName) || undefined,
    routeName: text(item.routeName) || undefined,
    validFrom: text(item.validFrom ?? item.startDate ?? item.activatedAt) || undefined,
    validTo: text(item.validTo ?? item.endDate ?? item.expiredAt) || undefined,
    price: optionalNumber(
      item.price ??
        item.amount ??
        item.fare ??
        item.total ??
        item.totalAmount ??
        item.paidAmount ??
        type.price ??
        type.amount ??
        order.total ??
        order.totalAmount,
    ),
  };
};

const normalizeHistory = (raw: unknown): TicketHistoryRow | null => {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  const time = text(item.time ?? item.scannedAt ?? item.timestamp ?? item.createdAt);
  return {
    id: text(item.id ?? item.historyId) || time,
    time,
    stationId: text(item.stationId) || undefined,
    stationName: text(item.stationName),
    gateId: text(item.gateId) || undefined,
    gateCode: text(item.gateCode ?? item.gateId) || undefined,
    action: text(item.action),
    result: text(item.result ?? item.status),
  };
};

const normalizeQrToken = (raw: unknown): QrTokenResult => {
  const item = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  const qrContent = text(item.qrContent ?? item.content);
  const qrToken = text(item.qrToken ?? item.token);
  return {
    token: qrContent || qrToken,
    qrContent: qrContent || undefined,
    qrToken: qrToken || undefined,
    qrCodeUrl: text(item.qrCodeUrl) || undefined,
    ticketId: text(item.ticketId) || undefined,
    createdAt: text(item.createdAt ?? item.issuedAt ?? item.generatedAt ?? item.createdDate) || undefined,
    expiresAt: text(item.expiresAt ?? item.expiredAt ?? item.expirationTime) || undefined,
    ttlSeconds: optionalNumber(item.ttlSeconds),
  };
};

export const myTicketErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    const message =
      typeof error.response?.data?.message === "string"
        ? error.response.data.message
        : error.message;
    return `${fallback}${message ? `: ${message}` : ""}`;
  }
  return fallback;
};

export const myTicketApi = {
  list: async (): Promise<MyTicketDto[]> => {
    const res = await apiClient.get(API_ENDPOINTS.my.tickets);
    return list(unwrapApiResponse(res.data)).map(normalizeTicket).filter(Boolean) as MyTicketDto[];
  },

  getById: async (id: string): Promise<MyTicketDto> => {
    const res = await apiClient.get(withPathParam(API_ENDPOINTS.my.tickets, id));
    return normalizeTicket(unwrapApiResponse(res.data)) as MyTicketDto;
  },

  getHistory: async (ticketId: string): Promise<TicketHistoryRow[]> => {
    const path = `${withPathParam(API_ENDPOINTS.my.tickets, ticketId)}/history`;
    const res = await apiClient.get(path);
    return list(unwrapApiResponse(res.data)).map(normalizeHistory).filter(Boolean) as TicketHistoryRow[];
  },

  createQrToken: async (ticketId: string): Promise<QrTokenResult> => {
    const path = `${withPathParam(API_ENDPOINTS.my.tickets, ticketId)}/qr-token`;
    const res = await apiClient.post(path);
    return normalizeQrToken(unwrapApiResponse(res.data));
  },
};
