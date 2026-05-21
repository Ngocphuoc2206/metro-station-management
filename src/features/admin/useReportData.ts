import { useState, useEffect } from "react";
import { apiClient } from "@features/httpClient/ApiClient";
import { API_ENDPOINTS, ApiResponse } from "@features/httpClient/apiEndpoints";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface RevenueChartPoint {
  date: string;
  actual: number;   // triệu VND
  forecast: number; // để 0 vì BE chưa có API dự báo
}

export interface StationPassengerPoint {
  name: string;
  value: number;
}

export interface HourlyTrafficPoint {
  time: string;
  val: number;
}

export interface ReportRow {
  date: string;
  count: number;
  revenueSingle: number;
  revenueMonthly: number;
  status: "MATCHED" | "PENDING" | "DISCREPANCY";
}

export interface ReportData {
  revenueChart: RevenueChartPoint[];
  stationPassengers: StationPassengerPoint[];
  hourlyTraffic: HourlyTrafficPoint[];
  tableRows: ReportRow[];
  loading: boolean;
  error: string | null;
}

// ── Backend shapes ─────────────────────────────────────────────────────────────
interface BackendOrder {
  orderId?: string;
  status?: string;
  totalAmount?: number;
  amount?: number;
  ticketType?: string;
  createdAt?: string;
}

interface BackendGateLog {
  logId?: string;
  stationName?: string;
  station?: string;
  result?: string;
  timestamp?: string;
  scanTime?: string;
  createdAt?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function groupByDate(orders: BackendOrder[]): RevenueChartPoint[] {
  const map: Record<string, number> = {};
  orders.forEach((o) => {
    if (!o.createdAt) return;
    const d = new Date(o.createdAt);
    const label = `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}`;
    const amount = (o.totalAmount ?? o.amount ?? 0) / 1_000_000;
    map[label] = (map[label] ?? 0) + amount;
  });
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-10) // 10 ngày gần nhất
    .map(([date, actual]) => ({ date, actual: +actual.toFixed(1), forecast: 0 }));
}

function groupByStation(logs: BackendGateLog[]): StationPassengerPoint[] {
  const map: Record<string, number> = {};
  logs.forEach((l) => {
    const station = l.stationName ?? l.station ?? "Khác";
    if ((l.result ?? "").toLowerCase() === "success") {
      map[station] = (map[station] ?? 0) + 1;
    }
  });
  return Object.entries(map)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, value]) => ({ name: name.slice(0, 7), value }));
}

function groupByHour(logs: BackendGateLog[]): HourlyTrafficPoint[] {
  const map: Record<number, number> = {};
  for (let h = 0; h < 24; h++) map[h] = 0;

  logs.forEach((l) => {
    const raw = l.timestamp ?? l.scanTime ?? l.createdAt;
    if (!raw) return;
    const h = new Date(raw).getHours();
    map[h] = (map[h] ?? 0) + 1;
  });

  return Object.entries(map)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([h, val]) => ({
      time: Number(h) % 4 === 0 ? `${String(h).padStart(2, "0")}:00` : "",
      val,
    }));
}

function buildTableRows(orders: BackendOrder[]): ReportRow[] {
  const map: Record<string, { count: number; single: number; monthly: number }> = {};
  orders.forEach((o) => {
    if (!o.createdAt) return;
    const d = new Date(o.createdAt);
    const date = `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
    if (!map[date]) map[date] = { count: 0, single: 0, monthly: 0 };
    map[date].count += 1;
    const amount = o.totalAmount ?? o.amount ?? 0;
    const isMonthly = (o.ticketType ?? "").toLowerCase().includes("month") ||
      (o.ticketType ?? "").toLowerCase().includes("thang");
    if (isMonthly) map[date].monthly += amount;
    else map[date].single += amount;
  });

  return Object.entries(map)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 10)
    .map(([date, v]) => ({
      date,
      count: v.count,
      revenueSingle: v.single,
      revenueMonthly: v.monthly,
      status: "MATCHED" as const,
    }));
}

// ── Hook ───────────────────────────────────────────────────────────────────────
export function useReportData(): ReportData {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revenueChart, setRevenueChart] = useState<RevenueChartPoint[]>([]);
  const [stationPassengers, setStationPassengers] = useState<StationPassengerPoint[]>([]);
  const [hourlyTraffic, setHourlyTraffic] = useState<HourlyTrafficPoint[]>([]);
  const [tableRows, setTableRows] = useState<ReportRow[]>([]);

  useEffect(() => {
    setLoading(true);

    Promise.all([
      apiClient
        .get<ApiResponse<BackendOrder[]>>(API_ENDPOINTS.orders.status)
        .then((r) => r.data.results ?? [])
        .catch(() => [] as BackendOrder[]),
      apiClient
        .get<ApiResponse<BackendGateLog[]>>(API_ENDPOINTS.gates.logs)
        .then((r) => r.data.results ?? [])
        .catch(() => [] as BackendGateLog[]),
    ]).then(([orders, gateLogs]) => {
      setRevenueChart(groupByDate(orders));
      setStationPassengers(groupByStation(gateLogs));
      setHourlyTraffic(groupByHour(gateLogs));
      setTableRows(buildTableRows(orders));
      setError(null);
    }).catch((err) => {
      setError(err?.message ?? "Không thể tải báo cáo.");
    }).finally(() => setLoading(false));
  }, []);

  return { revenueChart, stationPassengers, hourlyTraffic, tableRows, loading, error };
}
