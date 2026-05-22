import { apiClient } from "@features/httpClient/ApiClient";
import { API_ENDPOINTS, withPathParam } from "@features/httpClient/apiEndpoints";
import { unwrapApiResponse } from "@features/httpClient/unwrap";
import type { MyTicketDto, QrTokenResult, TicketHistoryRow } from "./myTicketTypes";

export const myTicketApi = {
  list: async (): Promise<MyTicketDto[]> => {
    const res = await apiClient.get(API_ENDPOINTS.my.tickets);
    return unwrapApiResponse<MyTicketDto[]>(res.data);
  },

  getById: async (id: string): Promise<MyTicketDto> => {
    const res = await apiClient.get(withPathParam(API_ENDPOINTS.my.tickets, id));
    return unwrapApiResponse<MyTicketDto>(res.data);
  },

  getHistory: async (ticketId: string): Promise<TicketHistoryRow[]> => {
    const res = await apiClient.get(withPathParam(API_ENDPOINTS.my.tickets, `${ticketId}/history`));
    return unwrapApiResponse<TicketHistoryRow[]>(res.data);
  },

  createQrToken: async (ticketId: string): Promise<QrTokenResult> => {
    const res = await apiClient.post(withPathParam(API_ENDPOINTS.my.tickets, `${ticketId}/qr-token`));
    return unwrapApiResponse<QrTokenResult>(res.data);
  },
};
