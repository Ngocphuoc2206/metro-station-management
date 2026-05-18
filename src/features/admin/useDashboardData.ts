import { useState, useEffect } from "react";
import type {
  KpiData,
  RevenuePoint,
  GateActivity,
  Alert,
  TimeRange,
} from "./adminDashboardTypes";

// ── Mock generators ────────────────────────────────────────────────────────────

function mockKpi(range: TimeRange): KpiData {
  const base = range === "today" ? 45.8 : range === "7d" ? 312.4 : 1280.6;
  return {
    revenue: base * 1_000_000,
    revenueChange: range === "today" ? 12 : range === "7d" ? 8.5 : -2.3,
    totalTrips:
      range === "today" ? 125_400 : range === "7d" ? 874_200 : 3_410_000,
    peakStart: "07:30",
    peakEnd: "08:30",
    criticalAlerts: range === "today" ? 5 : range === "7d" ? 3 : 1,
    isLoading: false,
    error: null,
  };
}

function mockRevenue(range: TimeRange): RevenuePoint[] {
  if (range === "today") {
    return [
      { label: "00h", value: 1.2 },
      { label: "04h", value: 0.3 },
      { label: "08h", value: 12.4 },
      { label: "12h", value: 9.8 },
      { label: "16h", value: 14.2 },
      { label: "20h", value: 7.9 },
    ];
  }
  if (range === "7d") {
    return [
      { label: "T2", value: 42.1 },
      { label: "T3", value: 38.7 },
      { label: "T4", value: 45.8 },
      { label: "T5", value: 50.2 },
      { label: "T6", value: 55.1 },
      { label: "T7", value: 61.3 },
      { label: "CN", value: 48.9 },
    ];
  }
  // 30d — show weekly aggregates
  return Array.from({ length: 5 }, (_, i) => ({
    label: `T${i + 1}`,
    value: +(240 + Math.sin(i) * 40).toFixed(1),
  }));
}

function mockGates(): GateActivity[] {
  return [
    { station: "Bến Thành", passengers: 24_500 },
    { station: "Nhà hát Thành phố", passengers: 18_200 },
    { station: "Ba Son", passengers: 15_900 },
    { station: "Tân Cảng", passengers: 12_400 },
    { station: "Suối Tiên", passengers: 10_800 },
  ];
}

function mockAlerts(): Alert[] {
  return [
    {
      id: "#ERR-0941",
      station: "Bến Thành",
      device: "Cổng soát vé A-04",
      content: "Kẹt vé cơ học",
      severity: "critical",
      time: "08:15:22",
    },
    {
      id: "#ERR-0938",
      station: "Tân Cảng",
      device: "Máy bán vé TVM-02",
      content: "Lỗi kết nối Server",
      severity: "critical",
      time: "08:02:10",
    },
    {
      id: "#ERR-0935",
      station: "Ba Son",
      device: "UPS trung tâm",
      content: "Pin dự phòng yếu",
      severity: "warning",
      time: "07:55:45",
    },
    {
      id: "#ERR-0930",
      station: "Nhà hát Thành phố",
      device: "Camera C-11",
      content: "Mất tín hiệu hình ảnh",
      severity: "warning",
      time: "07:30:00",
    },
    {
      id: "#ERR-0928",
      station: "Tân Cảng",
      device: "Màn hình LED-03",
      content: "Hiển thị không đúng lịch",
      severity: "info",
      time: "07:18:33",
    },
  ];
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
  const [kpiError] = useState<string | null>(null);
  const [kpi, setKpi] = useState<KpiData>(mockKpi(range));

  const [revenueLoading, setRevenueLoading] = useState(true);
  const [revenueError] = useState<string | null>(null);
  const [revenue, setRevenue] = useState<RevenuePoint[]>([]);
  const [gates] = useState<GateActivity[]>(mockGates());
  const [alerts] = useState<Alert[]>(mockAlerts());

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setKpiLoading(true);
    setRevenueLoading(true);
    const t1 = setTimeout(() => {
      setKpi(mockKpi(range));
      setKpiLoading(false);
    }, 600);
    const t2 = setTimeout(() => {
      setRevenue(mockRevenue(range));
      setRevenueLoading(false);
    }, 900);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [range]);

  return {
    kpi,
    revenue,
    gates,
    alerts,
    revenueLoading,
    revenueError,
    kpiLoading,
    kpiError,
  };
}
