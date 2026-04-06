import React from "react";
import ReportHeader from "./ReportHeader";
import ReportFilter from "./ReportFilter";
import ReportDashboardCharts from "./ReportDashboardCharts";
import ReportDataTable from "./ReportDataTable";

export default function ReportManagement() {
  return (
    <div className="flex flex-col gap-6 relative pb-10">
      <ReportHeader />
      <ReportFilter />
      <ReportDashboardCharts />
      <ReportDataTable />
    </div>
  );
}
