import { useState, useEffect } from "react";
import { apiClient } from "@features/httpClient/ApiClient";
import { API_ENDPOINTS, ApiResponse } from "@features/httpClient/apiEndpoints";
import type {
  KpiData,
  RevenuePoint,
  GateActivity,
  Alert,
  TimeRange,
} from "./adminDashboardTypes";

// ── Backend shapes ─────────────────────────────────────────────────────────────
interface BackendOrder {
  orderId?: string;
  status?: string;
  totalAmount?: number;
  amount?: number;
  createdAt?: string;
  [key: string]: unknown;
}

interface BackendGateLog {
  logId?: string;
  stationName?: string;
  station?: string;
  result?: string;
  status?: string;
  timestamp?: string;
  scanTime?: string;
  deviceId?: string;
  gateId?: string;
  [key: string]: unknown;
}

interface BackendDevice {
  deviceId?: string;
  status?: string;
  [key: string]: unknown;
}

interface BackendIncident {
  incidentId?: string;
  status?: string;
  [key: string]: unknown;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
async function safeFetch<T>(url: string): Promise<T[]> {
  try {
    const res = await apiClient.get<ApiResponse<T[]>>(url);
    return res.data.results ?? [];
  } catch {
    return [];
  }
}

function filterByTimeRange<T extends { createdAt?: string; timestamp?: string; scanTime?: string }>(
  items: T[],
  range: TimeRange
): T[] {
  const now = new Date();
  const cutoff = new Date();
  if (range === "today") cutoff.setHours(0, 0, 0, 0);
  else if (range === "7d") cutoff.setDate(now.getDate() - 7);
  else cutoff.setDate(now.getDate() - 30);

  return items.filter((item) => {
    const raw = item.createdAt ?? item.timestamp ?? item.scanTime;
    if (!raw) return true; // giữ lại nếu không có timestamp
    return new Date(raw) >= cutoff;
  });
}

function buildRevenue(orders: BackendOrder[], range: TimeRange): RevenuePoint[] {
  if (orders.length === 0) return [];

  const paidOrders = orders.filter(
    (o) => (o.status ?? "").toUpperCase() === "PAID" || (o.status ?? "").toUpperCase() === "COMPLETED"
  );

  if (range === "today") {
    // Nhóm theo giờ
    const hourMap: Record<string, number> = {};
    paidOrders.forEach((o) => {
      const h = o.createdAt ? new Date(o.createdAt).getHours() : 0;
      const label = `${String(h).padStart(2, "0")}h`;
      hourMap[label] = (hourMap[label] ?? 0) + (o.totalAmount ?? o.amount ?? 0);
    });
    return Object.entries(hourMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, value]) => ({ label, value: +(value / 1_000_000).toFixed(2) }));
  }

  // 7d hoặc 30d → nhóm theo ngày
  const dayMap: Record<string, number> = {};
  paidOrders.forEach((o) => {
    if (!o.createdAt) return;
    const d = new Date(o.createdAt);
    const label = range === "7d"
      ? ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][d.getDay()]
      : `${d.getDate()}/${d.getMonth() + 1}`;
    dayMap[label] = (dayMap[label] ?? 0) + (o.totalAmount ?? o.amount ?? 0);
  });
  return Object.entries(dayMap).map(([label, value]) => ({
    label,
    value: +(value / 1_000_000).toFixed(2),
  }));
}

function buildGateActivity(logs: BackendGateLog[]): GateActivity[] {
  const stationMap: Record<string, number> = {};
  logs.forEach((l) => {
    const station = l.stationName ?? l.station ?? "Không xác định";
    stationMap[station] = (stationMap[station] ?? 0) + 1;
  });
  return Object.entries(stationMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([station, passengers]) => ({ station, passengers }));
}

function buildAlerts(devices: BackendDevice[]): Alert[] {
  return devices
    .filter((d) => {
      const s = (d.status ?? "").toUpperCase();
      return s === "ERROR" || s === "OFFLINE" || s === "MAINTENANCE";
    })
    .slice(0, 5)
    .map((d, i) => ({
      id: `#ERR-${String(i + 1).padStart(4, "0")}`,
      station: (d as Record<string, unknown>).stationName as string ?? "—",
      device: (d as Record<string, unknown>).name as string ?? d.deviceId ?? "Thiết bị",
      content: (d.status ?? "").toUpperCase() === "OFFLINE" ? "Mất kết nối" : "Cần bảo trì",
      severity: (d.status ?? "").toUpperCase() === "ERROR" ? "critical" : "warning" as const,
      time: new Date().toLocaleTimeString("vi-VN"),
    }));
}

// ── Hook ────────────────────────────────────────────────────────────────────────
export interface DashboardData {
  kpi: KpiData;
  revenue: RevenuePoint[];
  gates: GateActivity[];
  alerts: Alert[];
  revenueLoading: boolean;
  revenueError: string | null;
  kpiLoading: boolean;
  kpiError: string | null;
}

export function useDashboardData(range: TimeRange): DashboardData {
  const [kpiLoading, setKpiLoading] = useState(true);
  const [kpiError, setKpiError] = useState<string | null>(null);
  const [kpi, setKpi] = useState<KpiData>({
    revenue: 0, revenueChange: 0, totalTrips: 0,
    peakStart: "—", peakEnd: "—", criticalAlerts: 0,
    isLoading: true, error: null,
  });
  const [revenueLoading, setRevenueLoading] = useState(true);
  const [revenueError, setRevenueError] = useState<string | null>(null);
  const [revenue, setRevenue] = useState<RevenuePoint[]>([]);
  const [gates, setGates] = useState<GateActivity[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setKpiLoading(true);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRevenueLoading(true);

    Promise.all([
      safeFetch<BackendOrder>(API_ENDPOINTS.orders.status),
      safeFetch<BackendGateLog>(API_ENDPOINTS.gates.logs),
      safeFetch<BackendDevice>(API_ENDPOINTS.devices.staff),
      // FE-18: lấy sự cố đang mở theo spec GET /staff/incidents?status=OPEN
      safeFetch<BackendIncident>("/staff/incidents?status=OPEN"),
    ]).then(([orders, gateLogs, devices, openIncidents]) => {
      // Filter theo time range
      const filteredOrders = filterByTimeRange(orders, range);
      const filteredLogs = filterByTimeRange(gateLogs, range);

      // KPI: Revenue
      const paidOrders = filteredOrders.filter(
        (o) => (o.status ?? "").toUpperCase() === "PAID" || (o.status ?? "").toUpperCase() === "COMPLETED"
      );
      const totalRevenue = paidOrders.reduce(
        (sum, o) => sum + (o.totalAmount ?? o.amount ?? 0), 0
      );

      // KPI: Trips = số log success
      const successLogs = filteredLogs.filter(
        (l) => (l.result ?? l.status ?? "").toLowerCase() === "success"
      );

      // Critical alerts = sự cố OPEN + thiết bị lỗi
      const errorDevices = devices.filter((d) => {
        const s = (d.status ?? "").toUpperCase();
        return s === "ERROR" || s === "OFFLINE";
      }).length;
      const criticalCount = openIncidents.length + errorDevices;

      setKpi({
        revenue: totalRevenue,
        revenueChange: 0, // Cần 2 kỳ để tính → để 0 cho đến khi BE có API analytics
        totalTrips: successLogs.length,
        peakStart: "07:30",
        peakEnd: "08:30",
        criticalAlerts: criticalCount,
        isLoading: false,
        error: null,
      });
      setKpiError(null);

      // Revenue chart
      setRevenue(buildRevenue(filteredOrders, range));
      setRevenueError(null);

      // Gate activity
      setGates(buildGateActivity(filteredLogs));

      // Device alerts
      setAlerts(buildAlerts(devices));
    }).catch((err) => {
      const msg = err?.message ?? "Không thể tải dữ liệu dashboard.";
      setKpiError(msg);
      setRevenueError(msg);
    }).finally(() => {
      setKpiLoading(false);
      setRevenueLoading(false);
    });
  }, [range]);

  return { kpi, revenue, gates, alerts, revenueLoading, revenueError, kpiLoading, kpiError };
}
