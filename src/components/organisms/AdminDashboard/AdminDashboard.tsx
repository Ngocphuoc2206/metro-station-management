import { useState } from "react";
import AdminSidebar from "./AdminSidebar";
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
    <div className="flex min-h-screen w-full overflow-x-hidden bg-gray-50">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-gray-100 bg-white py-3 pl-16 pr-3 sm:pl-16 sm:pr-5 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Tìm kiếm hệ thống..."
                className="w-full min-w-0 rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 sm:w-64 sm:pr-4"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notification bell */}
            <button className="relative text-gray-400 hover:text-gray-700 transition">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {kpi.criticalAlerts > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">A</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 space-y-6 overflow-x-hidden overflow-y-auto px-3 py-4 sm:px-5 sm:py-5 lg:px-8 lg:py-6">
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCards kpi={kpi} isLoading={kpiLoading} error={kpiError} />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Revenue chart — wider */}
            <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
        </main>
      </div>
    </div>
  );
}
