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
  timeRange: "all" | "today" | "1h" | "8h";
  stationId: string;
  gateId: string;
  result: GateResult | "";
}
