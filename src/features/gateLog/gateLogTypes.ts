export type GateResult = "ALLOW" | "DENY";
export type GateAction = "TAP_IN" | "TAP_OUT";

export interface GateLog {
  id: string;
  timestamp: string;
  gateId: string;
  gateCode: string;
  ticketId: string;
  ticketCode: string;
  action: GateAction;
  result: GateResult;
  message?: string;
  stationId: string;
  stationName: string;
}

export interface GateLogs {
  dateFrom: string;
  dateTo: string;
  stationId: string;
  gateId: string;
  deviceId: string;
  result: GateResult | "";
}
