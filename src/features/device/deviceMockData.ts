import type { Device } from "./deviceTypes";

export const MOCK_DEVICES: Device[] = [
  // ── Cổng soát vé ──────────────────────────────────────────────────────
  {
    id: "G-STN-001",
    model: "NextGate V2",
    category: "gate",
    status: "online",
    lastSeen: "Bây giờ",
    station: "Bến Thành",
    metrics: {
      cpuUsage: 12, cpuLabel: "Optimal",
      temperature: 42, tempLabel: "Stable",
      memoryUsed: 3.4, memoryTotal: 8,
      latency: 15, latencyLabel: "Low",
    },
    activityLog: [
      { id: "1", message: "System Heartbeat – Status Online", time: "10:45:22", detail: "• Gateway 192.168.10.11", color: "green" },
      { id: "2", message: "Giao dịch thành công (Thẻ QR)", time: "10:42:15", detail: "• Mã vé: TK-29384", color: "blue" },
      { id: "3", message: "Cảnh báo: Cảm biến bị che", time: "10:38:05", detail: "• Sensor Area 4", color: "orange" },
      { id: "4", message: "Giao dịch thành công (NFC)", time: "10:35:48", detail: "• Mã vé: TK-29381", color: "blue" },
    ],
  },
  {
    id: "G-STN-002",
    model: "NextGate V2",
    category: "gate",
    status: "online",
    lastSeen: "2 phút trước",
    station: "Bến Thành",
    metrics: {
      cpuUsage: 8, cpuLabel: "Optimal",
      temperature: 39, tempLabel: "Stable",
      memoryUsed: 2.1, memoryTotal: 8,
      latency: 18, latencyLabel: "Low",
    },
    activityLog: [
      { id: "1", message: "System Heartbeat – Status Online", time: "10:43:00", detail: "• Gateway 192.168.10.12", color: "green" },
      { id: "2", message: "Giao dịch thành công (Thẻ QR)", time: "10:41:30", detail: "• Mã vé: TK-29370", color: "blue" },
    ],
  },
  {
    id: "G-STN-003",
    model: "NextGate V2 Pro",
    category: "gate",
    status: "error",
    lastSeen: "14:20 • 15/05",
    station: "Nhà hát Thành phố",
    metrics: {
      cpuUsage: 88, cpuLabel: "Critical",
      temperature: 71, tempLabel: "Hot",
      memoryUsed: 7.2, memoryTotal: 8,
      latency: 320, latencyLabel: "High",
    },
    activityLog: [
      { id: "1", message: "Lỗi: Kẹt vé cơ học", time: "14:20:11", detail: "• Ejector slot A", color: "orange" },
      { id: "2", message: "Restart tự động thất bại", time: "14:19:05", detail: "• Attempt 3/3", color: "orange" },
      { id: "3", message: "Cảnh báo nhiệt độ cao", time: "14:15:00", detail: "• Temp: 71°C", color: "orange" },
    ],
  },
  {
    id: "G-STN-004",
    model: "NextGate V2 Pro",
    category: "gate",
    status: "offline",
    lastSeen: "Hôm qua",
    station: "Ba Son",
    metrics: {
      cpuUsage: 0, cpuLabel: "Offline",
      temperature: 0, tempLabel: "Offline",
      memoryUsed: 0, memoryTotal: 8,
      latency: 0, latencyLabel: "Offline",
    },
    activityLog: [
      { id: "1", message: "Thiết bị mất kết nối", time: "09:12:44", detail: "• Last IP: 192.168.10.14", color: "gray" },
    ],
  },

  // ── Máy bán vé ────────────────────────────────────────────────────────
  {
    id: "TVM-STN-001",
    model: "VendX Pro 4000",
    category: "ticket-machine",
    status: "online",
    lastSeen: "Bây giờ",
    station: "Bến Thành",
    metrics: {
      cpuUsage: 22, cpuLabel: "Optimal",
      temperature: 44, tempLabel: "Stable",
      memoryUsed: 4.0, memoryTotal: 16,
      latency: 24, latencyLabel: "Low",
    },
    activityLog: [
      { id: "1", message: "Bán vé lượt thành công", time: "10:44:00", detail: "• Mã vé: TK-29390", color: "blue" },
      { id: "2", message: "Bổ sung tiền xu", time: "10:30:00", detail: "• +500 coin", color: "green" },
    ],
  },
  {
    id: "TVM-STN-002",
    model: "VendX Pro 4000",
    category: "ticket-machine",
    status: "error",
    lastSeen: "08:02 • Hôm nay",
    station: "Tân Cảng",
    metrics: {
      cpuUsage: 55, cpuLabel: "High",
      temperature: 58, tempLabel: "Warm",
      memoryUsed: 6.1, memoryTotal: 16,
      latency: 180, latencyLabel: "Medium",
    },
    activityLog: [
      { id: "1", message: "Lỗi kết nối Server", time: "08:02:10", detail: "• Timeout 30s", color: "orange" },
      { id: "2", message: "Giao dịch bị huỷ", time: "08:01:55", detail: "• Mã vé: TK-29350", color: "orange" },
    ],
  },

  // ── Máy nạp tiền ──────────────────────────────────────────────────────
  {
    id: "TOP-STN-001",
    model: "TopUp Station X1",
    category: "top-up",
    status: "online",
    lastSeen: "5 phút trước",
    station: "Bến Thành",
    metrics: {
      cpuUsage: 15, cpuLabel: "Optimal",
      temperature: 38, tempLabel: "Stable",
      memoryUsed: 1.8, memoryTotal: 8,
      latency: 12, latencyLabel: "Low",
    },
    activityLog: [
      { id: "1", message: "Nạp tiền thành công", time: "10:40:00", detail: "• +200.000 VND", color: "green" },
    ],
  },
  {
    id: "TOP-STN-002",
    model: "TopUp Station X1",
    category: "top-up",
    status: "offline",
    lastSeen: "2 ngày trước",
    station: "Suối Tiên",
    metrics: {
      cpuUsage: 0, cpuLabel: "Offline",
      temperature: 0, tempLabel: "Offline",
      memoryUsed: 0, memoryTotal: 8,
      latency: 0, latencyLabel: "Offline",
    },
    activityLog: [
      { id: "1", message: "Mất điện – UPS hết pin", time: "08:20:00", detail: "• UPS Level: 0%", color: "gray" },
    ],
  },
];
