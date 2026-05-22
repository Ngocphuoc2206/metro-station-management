export type MyTicketDto = {
  id: string;
  status?: string;
  code?: string;
  ticketTypeId?: string;
  validFrom?: string;
  validTo?: string;
  data?: unknown;
};

export type TicketHistoryRow = {
  id?: string;
  time?: string;
  stationId?: string;
  stationName?: string;
  gateId?: string;
  action?: string;
  result?: string;
  data?: unknown;
};

export type QrTokenResult = {
  token: string;
  expiresAt?: string;
};
