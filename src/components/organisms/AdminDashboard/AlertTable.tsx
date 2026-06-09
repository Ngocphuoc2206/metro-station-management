import type { Alert } from "@features/admin/adminDashboardTypes";
import Link from "next/link";

const SEVERITY_STYLES = {
  critical: "bg-red-100 text-red-700 border-red-200",
  warning: "bg-amber-100 text-amber-700 border-amber-200",
  info: "bg-blue-100 text-blue-700 border-blue-200",
};


interface Props {
  alerts: Alert[];
}

export default function AlertTable({ alerts }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
        <h2 className="text-base font-semibold text-gray-900">
          Cảnh báo sự cố nghiêm trọng
        </h2>
        <Link href="/admin/incidents" className="text-sm text-blue-600 hover:underline font-medium">
          Xem tất cả
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-50">
              {["MÃ SỰ CỐ", "GA", "THIẾT BỊ", "NỘI DUNG SỰ CỐ", "THỜI GIAN", "THAO TÁC"].map(
                (col) => (
                  <th
                    key={col}
                    className="px-5 py-3 text-left text-xs font-semibold text-gray-400 tracking-wider"
                  >
                    {col}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {alerts.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-gray-400 text-sm">
                  Không có cảnh báo hay sự cố nghiêm trọng nào
                </td>
              </tr>
            ) : (
              alerts.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-blue-600">{a.id}</td>
                  <td className="px-5 py-3.5 text-gray-700">{a.station}</td>
                  <td className="px-5 py-3.5 text-gray-600">{a.device}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${SEVERITY_STYLES[a.severity]}`}
                    >
                      {a.content}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 font-mono">{a.time}</td>
                  <td className="px-5 py-3.5">
                    {a.isIncident ? (
                      <Link
                        href="/admin/incidents"
                        className="text-blue-500 hover:text-blue-700 transition-colors flex items-center gap-0.5 font-bold text-xs"
                      >
                        Duyệt
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    ) : (
                      <Link
                        href="/admin/devices"
                        className="text-gray-400 hover:text-blue-600 transition-colors flex items-center"
                        title="Xem chi tiết thiết bị"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </Link>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
