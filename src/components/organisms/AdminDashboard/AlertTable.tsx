import type { Alert } from "@features/admin/adminDashboardTypes";

const SEVERITY_STYLES = {
  critical: "bg-red-100 text-red-700 border-red-200",
  warning: "bg-amber-100 text-amber-700 border-amber-200",
  info: "bg-blue-100 text-blue-700 border-blue-200",
};

const SEVERITY_LABELS = {
  critical: "Critical",
  warning: "Warning",
  info: "Info",
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
          Cảnh báo &amp; Sự cố nghiêm trọng
        </h2>
        <button className="text-sm text-blue-600 hover:underline font-medium">
          Xem tất cả
        </button>
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
            {alerts.map((a) => (
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
                  <button
                    className="text-gray-400 hover:text-blue-600 transition-colors"
                    title="Xem chi tiết"
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
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
