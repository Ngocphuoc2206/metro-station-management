import type { GateLog } from "./gateLogTypes";

function ts(date: string, time: string) {
  return `${date} ${time}`;
}

export const MOCK_GATE_LOGS: GateLog[] = [
  {
    id: "LOG-001", timestamp: ts("08/07/2023", "19:32:55"), gateId: "G-STN-001",
    ticketId: "G-STN-0003", action: "enter", result: "success", ticketType: "qr",
    passengerName: "Nguyễn Văn A", station: "Bến Thành",
    deviceFirmware: "v2.4.1", transactionMs: 120,
  },
  {
    id: "LOG-002", timestamp: ts("08/07/2023", "19:32:45"), gateId: "G-STN-001",
    ticketId: "G-STN-0003", action: "enter", result: "success", ticketType: "nfc",
    passengerName: "Trần Thị B", station: "Bến Thành",
    deviceFirmware: "v2.4.1", transactionMs: 95,
  },
  {
    id: "LOG-003", timestamp: ts("08/07/2023", "19:32:45"), gateId: "G-STN-002",
    ticketId: "G-STN-0003", action: "enter", result: "rejected", ticketType: "qr",
    passengerName: "Lê Văn C", station: "Bến Thành",
    rejectionReason: "Vé đã hết hạn", deviceFirmware: "v2.4.1", transactionMs: 88,
  },
  {
    id: "LOG-004", timestamp: ts("08/07/2023", "19:32:42"), gateId: "G-STN-001",
    ticketId: "G-STN-0003", action: "enter", result: "success", ticketType: "monthly",
    passengerName: "Phạm Thị D", station: "Bến Thành",
    deviceFirmware: "v2.4.1", transactionMs: 102,
  },
  {
    id: "LOG-005", timestamp: ts("08/07/2023", "19:32:42"), gateId: "G-STN-001",
    ticketId: "G-STN-0003", action: "enter", result: "success", ticketType: "qr",
    passengerName: "Hoàng Văn E", station: "Bến Thành",
    deviceFirmware: "v2.4.1", transactionMs: 115,
  },
  {
    id: "LOG-006", timestamp: ts("08/07/2023", "19:32:47"), gateId: "G-STN-007",
    ticketId: "G-STN-0003", action: "enter", result: "rejected", ticketType: "daily",
    passengerName: "Võ Thị F", station: "Nhà hát Thành phố",
    rejectionReason: "Sai ga xuất phát", deviceFirmware: "v2.3.9", transactionMs: 77,
  },
  {
    id: "LOG-007", timestamp: ts("08/07/2023", "19:31:55"), gateId: "G-STN-003",
    ticketId: "TK-29390", action: "exit", result: "success", ticketType: "qr",
    passengerName: "Đặng Văn G", station: "Ba Son",
    deviceFirmware: "v2.4.1", transactionMs: 109,
  },
  {
    id: "LOG-008", timestamp: ts("08/07/2023", "19:31:30"), gateId: "G-STN-003",
    ticketId: "TK-29388", action: "exit", result: "success", ticketType: "nfc",
    passengerName: "Bùi Thị H", station: "Ba Son",
    deviceFirmware: "v2.4.1", transactionMs: 91,
  },
  {
    id: "LOG-009", timestamp: ts("08/07/2023", "19:30:11"), gateId: "G-STN-004",
    ticketId: "TK-29375", action: "enter", result: "rejected", ticketType: "qr",
    station: "Tân Cảng",
    rejectionReason: "QR không hợp lệ", deviceFirmware: "v2.4.0", transactionMs: 65,
  },
  {
    id: "LOG-010", timestamp: ts("08/07/2023", "19:29:50"), gateId: "G-STN-002",
    ticketId: "TK-29370", action: "enter", result: "success", ticketType: "monthly",
    passengerName: "Trương Văn I", station: "Bến Thành",
    deviceFirmware: "v2.4.1", transactionMs: 130,
  },
  {
    id: "LOG-011", timestamp: ts("08/07/2023", "19:29:20"), gateId: "G-STN-005",
    ticketId: "TK-29365", action: "enter", result: "success", ticketType: "daily",
    passengerName: "Lý Thị J", station: "Suối Tiên",
    deviceFirmware: "v2.4.1", transactionMs: 98,
  },
  {
    id: "LOG-012", timestamp: ts("08/07/2023", "19:28:44"), gateId: "G-STN-001",
    ticketId: "TK-29360", action: "exit", result: "success", ticketType: "qr",
    passengerName: "Đinh Văn K", station: "Bến Thành",
    deviceFirmware: "v2.4.1", transactionMs: 112,
  },
];

export const GATE_IDS = ["G-STN-001", "G-STN-002", "G-STN-003", "G-STN-004", "G-STN-005", "G-STN-007"];
