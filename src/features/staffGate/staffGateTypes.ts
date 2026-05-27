export type ScanTicketRequest = {
  qrContent: string;
  deviceId: string;
  stationId: string;
  gateId: string;
};


// Backend: GateScanResponse
export type GateScanResponse = {
  result: string;
  action: string;
  message: string;
  ticketId: string;
  ticketCode: string;
  gateId: string;
  stationId: string;
  scannedAt: string;
};

// Backend: GateScanLogResponse
export type GateScanLogResponse = {
  id: string;
  gateId: string;
  gateCode: string;
  stationId: string;
  stationName: string;
  ticketId: string;
  ticketCode: string;
  action: string;
  result: string;
  message: string;
  scannedAt: string;
};

// Backend: GateResponse
export type GateResponse = {
  gateId: string;
  gateCode: string;
  name: string;
  stationId: string;
  stationName: string;
  action: string;
  status: string;
};
