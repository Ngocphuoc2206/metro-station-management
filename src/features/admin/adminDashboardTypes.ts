export type TimeRange = "today" | "7d" | "30d";

export interface KpiData {
  revenue: number;        // VND
  revenueChange: number;  // percentage vs prev period
  totalTrips: number;
  peakStart: string;      // "HH:mm"
  peakEnd: string;        // "HH:mm"
  criticalAlerts: number;
  isLoading: boolean;
  error: string | null;
}

export interface RevenuePoint {
  label: string;  // "T2", "T3", … or "01/03", …
  value: number;  // VND in millions
}

export interface GateActivity {
  station: string;
  passengers: number;
}

export type AlertSeverity = "critical" | "warning" | "info";

export interface Alert {
  id: string;       // "#ERR-0941"
  station: string;
  device: string;
  content: string;
  severity: AlertSeverity;
  time: string;     // "HH:mm:ss"
}
