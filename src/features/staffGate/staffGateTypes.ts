export type ScanTicketRequest = {
  qrContent: string;
  deviceId: string;
  stationId: string;
  gateId: string;
};

// Backend response shape wasn't provided; keep flexible.
export type ScanTicketResult = Record<string, unknown>;
