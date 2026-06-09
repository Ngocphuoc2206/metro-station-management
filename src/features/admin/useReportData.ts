import { useState, useEffect } from "react";
import { reportApi, type RevenueReport, type TicketSalesReport, type GateActivityReport } from "@features/admin/reportApi";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface RevenueChartPoint {
  date: string;
  actual: number;   // triệu VND
  forecast: number;
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

// ── Helpers ────────────────────────────────────────────────────────────────────
// Convert revenue report to chart data
function processRevenueData(reports: RevenueReport[]): RevenueChartPoint[] {
  return reports
    .map((item) => ({
      date: new Date(item.date).toLocaleDateString("vi-VN", { month: "2-digit", day: "2-digit" }),
      actual: Math.round((item.revenue / 1_000_000) * 10) / 10, // Convert to millions VND
      forecast: 0,
    }))
    .slice(-10); // Last 10 days
}

// Convert gate activity report to station data
function processGateActivityData(activities: GateActivityReport[]): StationPassengerPoint[] {
  return activities
    .filter((item) => item && item.station && typeof item.passengers === 'number')
    .sort((a, b) => b.passengers - a.passengers)
    .slice(0, 5)
    .map((item) => ({
      name: (item.station || "Unknown").slice(0, 7),
      value: item.passengers || 0,
    }));
}

// Mock hourly traffic (from gate activity timestamps if available)
function generateHourlyTraffic(): HourlyTrafficPoint[] {
  const map: Record<number, number> = {};
  for (let h = 0; h < 24; h++) map[h] = 0;
  
  // Generate mock data since backend doesn't have hourly breakdown
  for (let h = 0; h < 24; h++) {
    if (h >= 6 && h <= 22) {
      map[h] = Math.floor(Math.random() * 150 + 50);
    }
  }

  return Object.entries(map)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([h, val]) => ({
      time: Number(h) % 4 === 0 ? `${String(h).padStart(2, "0")}:00` : "",
      val,
    }));
}

// Process ticket sales for table rows
function buildTableRows(ticketSales: TicketSalesReport[]): ReportRow[] {
  const map: Record<string, { count: number; single: number; monthly: number }> = {};
  
  ticketSales.forEach((item) => {
    const date = new Date(item.date).toLocaleDateString("vi-VN");
    if (!map[date]) map[date] = { count: 0, single: 0, monthly: 0 };
    map[date].count += item.quantitySold;
    
    const isMonthly = item.ticketTypeName.toLowerCase().includes("month") || 
                      item.ticketTypeName.toLowerCase().includes("thang");
    if (isMonthly) {
      map[date].monthly += item.amount;
    } else {
      map[date].single += item.amount;
    }
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
export function useReportData(dateRange: "today" | "7d" | "30d" = "30d"): ReportData {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revenueChart, setRevenueChart] = useState<RevenueChartPoint[]>([]);
  const [stationPassengers, setStationPassengers] = useState<StationPassengerPoint[]>([]);
  const [hourlyTraffic, setHourlyTraffic] = useState<HourlyTrafficPoint[]>([]);
  const [tableRows, setTableRows] = useState<ReportRow[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);

    Promise.all([
      reportApi.getRevenueReport(dateRange),
      reportApi.getTicketSalesReport(dateRange),
      reportApi.getGateActivityReport(dateRange),
    ])
      .then(([revenueData, ticketData, gateData]) => {
        setRevenueChart(processRevenueData(revenueData));
        setStationPassengers(processGateActivityData(gateData));
        setHourlyTraffic(generateHourlyTraffic());
        setTableRows(buildTableRows(ticketData));
        setError(null);
      })
      .catch((err) => {
        console.error("Failed to load reports:", err);
        setError(err?.message ?? "Không thể tải báo cáo.");
      })
      .finally(() => setLoading(false));
  }, [dateRange]);

  return { revenueChart, stationPassengers, hourlyTraffic, tableRows, loading, error };
}
