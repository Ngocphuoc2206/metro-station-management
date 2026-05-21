import type { ReportRow } from "@features/admin/useReportData";

interface Props {
  rows: ReportRow[];
}

export default function ReportDataTable({ rows }: Props) {

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const getStatusBadge = (status: "MATCHED" | "PENDING" | "DISCREPANCY") => {
    switch (status) {
      case "MATCHED":
        return <span className="inline-flex px-2py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-md uppercase tracking-wider">Đã khớp</span>;
      case "PENDING":
        return <span className="inline-flex px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-md uppercase tracking-wider">Đang chờ</span>;
      case "DISCREPANCY":
        return <span className="inline-flex px-2 py-1 bg-red-100 text-red-700 text-[10px] font-bold rounded-md uppercase tracking-wider">Lệch số liệu</span>;
    }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm w-full overflow-hidden mt-6">
      
      {/* Header Table */}
      <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-lg font-bold text-gray-900">Tổng hợp dữ liệu theo ngày</h3>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            Tải CSV
          </button>
          <button className="px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            In báo cáo
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr>
              <th className="px-6 py-5 border-b border-gray-100 text-[11px] font-bold text-blue-600 uppercase tracking-widest whitespace-nowrap bg-blue-50/30">Ngày</th>
              <th className="px-6 py-5 border-b border-gray-100 text-[11px] font-bold text-blue-600 uppercase tracking-widest whitespace-nowrap bg-blue-50/30 text-right">Số lượt đi</th>
              <th className="px-6 py-5 border-b border-gray-100 text-[11px] font-bold text-blue-600 uppercase tracking-widest whitespace-nowrap bg-blue-50/30 text-right">Doanh thu vé lượt</th>
              <th className="px-6 py-5 border-b border-gray-100 text-[11px] font-bold text-blue-600 uppercase tracking-widest whitespace-nowrap bg-blue-50/30 text-right">Doanh thu vé tháng</th>
              <th className="px-6 py-5 border-b border-gray-100 text-[11px] font-bold text-blue-600 uppercase tracking-widest whitespace-nowrap bg-blue-50/30 text-right">Tổng cộng</th>
              <th className="px-6 py-5 border-b border-gray-100 text-[11px] font-bold text-blue-600 uppercase tracking-widest whitespace-nowrap bg-blue-50/30 text-center">Trạng thái đối soát</th>
              <th className="px-6 py-5 border-b border-gray-100 text-[11px] font-bold text-blue-600 uppercase tracking-widest whitespace-nowrap bg-blue-50/30 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-gray-400 text-sm">
                  Không có dữ liệu báo cáo.
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => {
              const total = row.revenueSingle + row.revenueMonthly;
              return (
                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">{row.date}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-700 text-right">{row.count.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-600 text-right">{formatCurrency(row.revenueSingle)}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-600 text-right">{formatCurrency(row.revenueMonthly)}</td>
                  <td className="px-6 py-4 text-sm font-bold text-blue-700 text-right">{formatCurrency(total)}</td>
                  <td className="px-6 py-4 text-center">{getStatusBadge(row.status)}</td>
                  <td className="px-6 py-4 text-center">
                    <button className="text-blue-600 hover:text-blue-800 text-[13px] font-bold hover:underline">Chi tiết</button>
                  </td>
                </tr>
              );
            })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
