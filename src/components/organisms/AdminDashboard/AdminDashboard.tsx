import { useState } from "react";
import AdminLayout from "./AdminLayout";
import KpiCards from "./KpiCards";
import TimeFilter from "./TimeFilter";
import RevenueChart from "./RevenueChart";
import GateActivityChart from "./GateActivityChart";
import AlertTable from "./AlertTable";
import { useDashboardData } from "@features/admin/useDashboardData";
import type { TimeRange } from "@features/admin/adminDashboardTypes";

export default function AdminDashboard() {
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");
  const { kpi, revenue, gates, alerts, kpiLoading, kpiError, revenueLoading, revenueError } =
    useDashboardData(timeRange);

  return (
    <AdminLayout title="Tổng quan hệ thống | MetroNext">
      {/* Breadcrumb + Title */}
      <div>
        <nav className="text-xs text-gray-400 mb-1">
          <span>Admin</span>
          <span className="mx-1">›</span>
          <span className="text-gray-600">Tổng quan</span>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900">Tổng quan hệ thống</h1>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCards kpi={kpi} isLoading={kpiLoading} error={kpiError} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Revenue chart — wider */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-800">
              Biểu đồ doanh thu 7 ngày qua
            </h2>
            <TimeFilter value={timeRange} onChange={setTimeRange} />
          </div>
          <RevenueChart data={revenue} isLoading={revenueLoading} error={revenueError} />
        </div>

        {/* Gate activity */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">
            Lưu lượng theo ga (Top 5)
          </h2>
          <GateActivityChart data={gates} />
        </div>
      </div>

      {/* Alert table */}
      <AlertTable alerts={alerts} />
    </AdminLayout>
  );
}