import React, { useState } from "react";
import ReportHeader from "./ReportHeader";
import ReportFilter from "./ReportFilter";
import ReportDashboardCharts from "./ReportDashboardCharts";
import ReportDataTable from "./ReportDataTable";
import { useReportData } from "@features/admin/useReportData";

export default function ReportManagement() {
  const [dateRange, setDateRange] = useState<"today" | "7d" | "30d">("30d");
  const reportData = useReportData(dateRange);

  const handleFilterSearch = (filters: { date: string; station: string; channel: string }) => {
    if (filters.date === "today" || filters.date === "7d" || filters.date === "30d") {
      setDateRange(filters.date);
    }
  };

  const handleExportExcel = () => {
    if (!reportData.tableRows || reportData.tableRows.length === 0) {
      alert("Không có dữ liệu để xuất báo cáo!");
      return;
    }

    const title = "Báo cáo doanh thu & lưu lượng";
    const headerRow = `
      <tr>
        <th style="background-color: #3b82f6; color: #ffffff; font-weight: bold; border: 1px solid #cbd5e1; padding: 8px;">Ngày</th>
        <th style="background-color: #3b82f6; color: #ffffff; font-weight: bold; border: 1px solid #cbd5e1; padding: 8px; text-align: right;">Số lượt đi</th>
        <th style="background-color: #3b82f6; color: #ffffff; font-weight: bold; border: 1px solid #cbd5e1; padding: 8px; text-align: right;">Doanh thu vé lượt (VND)</th>
        <th style="background-color: #3b82f6; color: #ffffff; font-weight: bold; border: 1px solid #cbd5e1; padding: 8px; text-align: right;">Doanh thu vé tháng (VND)</th>
        <th style="background-color: #3b82f6; color: #ffffff; font-weight: bold; border: 1px solid #cbd5e1; padding: 8px; text-align: right;">Tổng cộng (VND)</th>
        <th style="background-color: #3b82f6; color: #ffffff; font-weight: bold; border: 1px solid #cbd5e1; padding: 8px; text-align: center;">Trạng thái đối soát</th>
      </tr>
    `;

    const bodyRows = reportData.tableRows.map(row => {
      const total = row.revenueSingle + row.revenueMonthly;
      const statusText = row.status === "MATCHED" ? "Đã khớp" : row.status === "PENDING" ? "Đang chờ" : "Lệch số liệu";
      return `
        <tr>
          <td style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold; text-align: left;">${row.date}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">${row.count.toLocaleString()}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">${row.revenueSingle.toLocaleString()}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">${row.revenueMonthly.toLocaleString()}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right; color: #1d4ed8; font-weight: bold;">${total.toLocaleString()}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">${statusText}</td>
        </tr>
      `;
    }).join("");

    const htmlTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Báo cáo doanh thu</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <meta charset="utf-8" />
      </head>
      <body>
        <h2 style="font-family: Arial, sans-serif; color: #1e293b; margin-bottom: 15px;">${title} (${dateRange === "today" ? "Hôm nay" : dateRange === "7d" ? "7 ngày gần nhất" : "30 ngày gần nhất"})</h2>
        <table style="border-collapse: collapse; font-family: Arial, sans-serif; width: 100%; border: 1px solid #cbd5e1;">
          <thead>
            ${headerRow}
          </thead>
          <tbody>
            ${bodyRows}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([htmlTemplate], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Bao_cao_doanh_thu_${dateRange}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCSV = () => {
    if (!reportData.tableRows || reportData.tableRows.length === 0) {
      alert("Không có dữ liệu để tải CSV!");
      return;
    }

    const headers = ["Ngày", "Số lượt đi", "Doanh thu vé lượt (VND)", "Doanh thu vé tháng (VND)", "Tổng cộng (VND)", "Trạng thái đối soát"];
    const csvRows = [
      headers.join(","),
      ...reportData.tableRows.map(row => {
        const total = row.revenueSingle + row.revenueMonthly;
        const statusText = row.status === "MATCHED" ? "Đã khớp" : row.status === "PENDING" ? "Đang chờ" : "Lệch số liệu";
        return [
          row.date,
          row.count,
          row.revenueSingle,
          row.revenueMonthly,
          total,
          `"${statusText}"`
        ].join(",");
      })
    ];

    const csvContent = "\uFEFF" + csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Bao_cao_doanh_thu_${dateRange}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6 relative pb-10">
      <ReportHeader />
      <ReportFilter onSearch={handleFilterSearch} onExportExcel={handleExportExcel} />

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
          <ReportDataTable rows={reportData.tableRows} onExportCSV={handleExportCSV} />
        </>
      )}
    </div>
  );
}
