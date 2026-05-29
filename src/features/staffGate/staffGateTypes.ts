export type GateScanResult = "ALLOW" | "DENY";
export type GateAction = "TAP_IN" | "TAP_OUT";
export type GateStatus = "ACTIVE" | "INACTIVE" | "MAINTENANCE";

export type ScanTicketRequest = {
  qrContent: string;
  deviceId: string;
  stationId: string;
  gateId: string;
};

export type UpdateGateStatusRequest = {
  status: GateStatus;
};

// Backend: GateScanResponse
export type GateScanResponse = {
  result: GateScanResult | string;
  action: GateAction | string;
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
  action: GateAction | string;
  result: GateScanResult | string;
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
  action: GateAction | string;
  status: GateStatus | string;
  deviceId?: string;
  deviceCode?: string;
  type?: string;
  deviceType?: string;
};
