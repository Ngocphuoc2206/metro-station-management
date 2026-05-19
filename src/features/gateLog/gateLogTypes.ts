export type GateResult = "success" | "rejected";
export type GateAction = "enter" | "exit";
export type TicketType = "qr" | "nfc" | "monthly" | "daily";

export interface GateLog {
  id: string;
  timestamp: string; // "DD/MM/YYYY HH:mm:ss"
  gateId: string; // "G-STN-001"
  ticketId: string; // "G-STN-0003"
  action: GateAction;
  result: GateResult;
  ticketType: TicketType;
  // detail fields
  passengerName?: string;
  station: string;
  rejectionReason?: string; // only when result === "rejected"
  deviceFirmware?: string;
  transactionMs?: number; // response time in ms
}

export interface GateLogs {
  timeRange: "all" | "today" | "1h" | "8h";
  gateId: string; // "" = all
  ticketType: TicketType | "";
  result: GateResult | "";
}
