export type DeviceStatus = "online" | "offline" | "error";
export type DeviceCategory = "gate" | "ticket-machine" | "top-up";

export interface ActivityLog {
  id: string;
  message: string;
  time: string;   // "HH:mm:ss"
  detail: string; // "• Gateway 192.168.10.11"
  color: "green" | "blue" | "orange" | "gray";
}

export interface DeviceMetrics {
  cpuUsage: number;       // percentage 0–100
  cpuLabel: string;       // "Optimal" | "High" | "Critical"
  temperature: number;    // °C
  tempLabel: string;      // "Stable" | "Warm" | "Hot"
  memoryUsed: number;     // GB
  memoryTotal: number;    // GB
  latency: number;        // ms
  latencyLabel: string;   // "Low" | "Medium" | "High"
}

export interface Device {
  id: string;           // "G-STN-001"
  model: string;        // "NextGate V2"
  category: DeviceCategory;
  status: DeviceStatus;
  lastSeen: string;     // "Bây giờ" | "2 phút trước" | "14:20 • 15/05"
  station: string;
  metrics: DeviceMetrics;
  activityLog: ActivityLog[];
}
