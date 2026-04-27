import type { ShiftIncident } from "@features/shift/shiftTypes";

interface Props {
  incidents: ShiftIncident[];
  isLoading: boolean;
}

const SEVERITY_STYLES = {
  critical: "bg-red-50 text-red-700",
  warning: "bg-orange-50 text-orange-700",
  low: "bg-green-50 text-green-700",
};

const SEVERITY_LABELS = {
  critical: "NGUY CẤP",
  warning: "CẢNH BÁO",
  low: "THẤP",
};

const STATUS_STYLES = {
  open: "bg-gray-100 text-gray-700", // Chờ tiếp nhận
  in_progress: "bg-orange-100 text-orange-800", // Đang xử lý
  resolved: "bg-green-100 text-green-800", // Đã hoàn thành
};

const STATUS_LABELS = {
  open: "Chờ tiếp nhận",
  in_progress: "Đang xử lý",
  resolved: "Đã hoàn thành",
};

export default function ShiftIncidentList({ incidents, isLoading }: Props) {
  const openCount = incidents.filter(i => i.status !== "resolved").length;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-5 border-b border-gray-50 gap-4">
        <div className="flex items-center gap-3">
          <div className="text-orange-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-base font-bold text-gray-900">
            Danh sách sự cố trong ca
          </h2>
        </div>
        <div className="bg-orange-50 text-orange-700 text-xs font-bold px-3 py-1 rounded-full">
          {openCount} sự cố đang mở
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-50 text-left">
              <th className="px-6 py-4 text-xs font-bold text-gray-400 tracking-wide w-32">MÃ SỰ CỐ (ID)</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 tracking-wide w-32">MỨC ĐỘ</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 tracking-wide">NỘI DUNG</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 tracking-wide w-40">TRẠNG THÁI</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 tracking-wide text-right w-24">THAO TÁC</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 bg-white">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                  Đang tải danh sách sự cố...
                </td>
              </tr>
            ) : incidents.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                  Không có sự cố nào trong ca trực này.
                </td>
              </tr>
            ) : (
              incidents.map((incident) => (
                <tr key={incident.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-5 font-bold text-gray-900">
                    {incident.id}
                  </td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex items-center px-4 py-1.5 rounded-md text-[11px] font-bold tracking-wide ${SEVERITY_STYLES[incident.severity]}`}>
                      {SEVERITY_LABELS[incident.severity]}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-gray-600 font-medium">
                    {incident.content}
                  </td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11.5px] font-bold ${STATUS_STYLES[incident.status]}`}>
                      {STATUS_LABELS[incident.status]}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button 
                      onClick={() => alert(`Tính năng xem ${incident.status === "resolved" ? "Chi tiết" : "Cập nhật"} sự cố ${incident.id} đang được phát triển!`)}
                      className={`font-bold text-sm ${incident.status === "resolved" ? "text-gray-400 hover:text-gray-600" : "text-blue-600 hover:text-blue-800"}`}
                    >
                      {incident.status === "resolved" ? "Chi tiết" : "Cập nhật"}
                    </button>
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
