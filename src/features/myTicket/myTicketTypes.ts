export type MyTicketDto = {
  id: string;
  code: string;
  status: string;
  ticketTypeId?: string;
  ticketTypeName: string;
  originStationName?: string;
  destinationStationName?: string;
  routeName?: string;
  validFrom?: string;
  validTo?: string;
  price?: number;
};

export type TicketHistoryRow = {
  id: string;
  time: string;
  stationId?: string;
  stationName: string;
  gateId?: string;
  gateCode?: string;
  action: string;
  result: string;
};

export type QrTokenResult = {
  token: string;
  qrContent?: string;
  qrToken?: string;
  qrCodeUrl?: string;
  ticketId?: string;
  expiresAt?: string;
  ttlSeconds?: number;
};
