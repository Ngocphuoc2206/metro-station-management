import { useState, useEffect } from "react";
import { apiClient } from "@features/httpClient/ApiClient";
import { API_ENDPOINTS, ApiResponse } from "@features/httpClient/apiEndpoints";
import { reportApi, type TicketSalesReport, type RevenueReport } from "@features/admin/reportApi";
import type {
  KpiData,
  RevenuePoint,
  GateActivity,
  Alert,
  TimeRange,
} from "./adminDashboardTypes";

// ── Backend shapes ─────────────────────────────────────────────────────────────
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
  id?: string;
  title?: string;
  status?: string;
  priority?: string;
  createdAt?: string;
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

function processTicketSales7d(ticketSales: TicketSalesReport[]): RevenuePoint[] {
  const dayMap: Record<string, number> = {};
  const sorted = [...ticketSales].sort((a, b) => a.date.localeCompare(b.date));
  
  sorted.forEach((item) => {
    const parts = item.date.split("-");
    const label = parts.length === 3 ? `${parts[2]}/${parts[1]}` : item.date;
    dayMap[label] = (dayMap[label] ?? 0) + (item.amount ?? 0);
  });

  return Object.entries(dayMap).map(([label, value]) => ({
    label,
    value,
  }));
}

function processRevenue30d(revenueReports: RevenueReport[]): RevenuePoint[] {
  const sorted = [...revenueReports].sort((a, b) => a.date.localeCompare(b.date));
  return sorted.map((item) => {
    const parts = item.date.split("-");
    const label = parts.length === 3 ? `${parts[2]}/${parts[1]}` : item.date;
    return {
      label,
      value: item.revenue ?? 0,
    };
  });
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
      time: new Date().toLocaleTimeString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }),
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
    setRevenueLoading(true);

    const revenueReportPromise = range === "30d"
      ? reportApi.getRevenueReport("30d")
      : reportApi.getTicketSalesReport("7d");

    Promise.all([
      revenueReportPromise,
      safeFetch<BackendGateLog>(API_ENDPOINTS.gates.logs),
      safeFetch<BackendDevice>(API_ENDPOINTS.devices.staff),
      safeFetch<BackendIncident>(API_ENDPOINTS.incidents.staff),
    ]).then(([revenueReportData, gateLogs, devices, allIncidents]) => {
      // Filter theo time range
      const filteredLogs = filterByTimeRange(gateLogs, range);

      // KPI: Revenue from ticket sales or general revenue report
      let totalRevenue = 0;
      if (range === "30d") {
        const reports = revenueReportData as RevenueReport[];
        totalRevenue = reports.reduce((sum, r) => sum + (r.revenue ?? 0), 0);
        setRevenue(processRevenue30d(reports));
      } else {
        const sales = revenueReportData as TicketSalesReport[];
        totalRevenue = sales.reduce((sum, ts) => sum + (ts.amount ?? 0), 0);
        setRevenue(processTicketSales7d(sales));
      }

      // KPI: Trips = số log success
      const successLogs = filteredLogs.filter(
        (l) => (l.result ?? l.status ?? "").toLowerCase() === "success"
      );

      // Active incidents: not RESOLVED and not CLOSED
      const activeIncidents = allIncidents.filter((inc) => {
        const s = (inc.status ?? "").toUpperCase();
        return s !== "RESOLVED" && s !== "CLOSED";
      });

      // Critical alerts = sự cố active + thiết bị lỗi
      const errorDevices = devices.filter((d) => {
        const s = (d.status ?? "").toUpperCase();
        return s === "ERROR" || s === "OFFLINE";
      }).length;
      const criticalCount = activeIncidents.length + errorDevices;

      setKpi({
        revenue: totalRevenue,
        revenueChange: 0,
        totalTrips: successLogs.length,
        peakStart: "07:30",
        peakEnd: "08:30",
        criticalAlerts: criticalCount,
        isLoading: false,
        error: null,
      });
      setKpiError(null);

      // Revenue chart error check
      setRevenueError(null);

      // Gate activity
      setGates(buildGateActivity(filteredLogs));

      // Map active incidents to Alert format
      const incidentAlerts = activeIncidents.map((inc) => {
        const id = inc.id ?? "";
        const match = id.match(/\d+/);
        const shortCode = match ? `SC${String(parseInt(match[0], 10)).padStart(3, "0")}` : id.slice(0, 6).toUpperCase();

        const priority = (inc.priority ?? "").toUpperCase();
        let severity: "critical" | "warning" | "info" = "info";
        if (priority === "CRITICAL" || priority === "HIGH") severity = "critical";
        else if (priority === "MEDIUM") severity = "warning";

        let timeStr = "--:--";
        if (inc.createdAt) {
          try {
            const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(inc.createdAt);
            const matchTime = inc.createdAt.match(/^(\d{4})[./-](\d{2})[./-](\d{2})[T ](\d{2}):(\d{2}):(\d{2})/);
            if (matchTime && !hasTimezone) {
              const year = parseInt(matchTime[1], 10);
              const month = parseInt(matchTime[2], 10) - 1;
              const day = parseInt(matchTime[3], 10);
              const hour = parseInt(matchTime[4], 10);
              const minute = parseInt(matchTime[5], 10);
              const second = parseInt(matchTime[6], 10);
              const date = new Date(Date.UTC(year, month, day, hour, minute, second));
              timeStr = date.toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
                timeZone: "Asia/Ho_Chi_Minh",
              });
            } else {
              const normalized = hasTimezone ? inc.createdAt : `${inc.createdAt}Z`;
              timeStr = new Date(normalized).toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
                timeZone: "Asia/Ho_Chi_Minh",
              });
            }
          } catch {
            timeStr = inc.createdAt;
          }
        }

        return {
          id: shortCode,
          rawId: id,
          station: (inc.stationName as string) ?? inc.stationId ?? "—",
          device: (inc.deviceCode as string) ?? inc.deviceId ?? (inc.gateCode as string) ?? inc.gateId ?? "Hạ tầng",
          content: inc.title ?? "Sự cố không rõ nguyên nhân",
          severity,
          time: timeStr,
          isIncident: true,
        };
      });

      // Map device errors to Alert format
      const deviceAlerts = buildAlerts(devices);

      // Combine both lists and limit to 5
      setAlerts([...incidentAlerts, ...deviceAlerts].slice(0, 5));
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
