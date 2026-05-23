import React from "react";
import ReportHeader from "./ReportHeader";
import ReportFilter from "./ReportFilter";
import ReportDashboardCharts from "./ReportDashboardCharts";
import ReportDataTable from "./ReportDataTable";
import { useReportData } from "@features/admin/useReportData";

export default function ReportManagement() {
  const reportData = useReportData();

  return (
    <div className="flex flex-col gap-6 relative pb-10">
      <ReportHeader />
      <ReportFilter />

      {reportData.loading && (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <svg className="animate-spin w-6 h-6 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Đang tải báo cáo...
        </div>
      )}

      {!reportData.loading && reportData.error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-6 py-4 text-sm">
          ⚠️ {reportData.error}
        </div>
      )}

      {!reportData.loading && !reportData.error && (
        <>
          <ReportDashboardCharts
            revenueData={reportData.revenueChart}
            stationData={reportData.stationPassengers}
            histogramData={reportData.hourlyTraffic}
          />
          <ReportDataTable rows={reportData.tableRows} />
        </>
      )}
    </div>
  );
}
