import type { GateLog } from "@features/gateLog/gateLogTypes";

const ACTION_LABEL: Record<string, string> = { enter: "Vào", exit: "Ra" };
const TICKET_LABEL: Record<string, string> = {
  qr: "QR Code", nfc: "NFC / Thẻ", monthly: "Vé tháng", daily: "Vé ngày",
};

interface Props {
  logs: GateLog[];
  onDetail: (log: GateLog) => void;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (p: number) => void;
}

export default function GateLogTable({ logs, onDetail, page, pageSize, total, onPageChange }: Props) {
  const totalPages = Math.ceil(total / pageSize);

  if (logs.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <svg className="w-10 h-10 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-sm">Không có kết quả phù hợp</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {["THỜI GIAN", "MÃ CỔNG", "MÃ VÉ", "HÀNH ĐỘNG", "KẾT QUẢ", "CHI TIẾT"].map((col) => (
                <th key={col} className="px-5 py-3 text-left text-xs font-semibold text-gray-400 tracking-wider">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3.5 text-gray-600 font-mono text-xs whitespace-nowrap">
                  {log.timestamp}
                </td>
                <td className="px-5 py-3.5 font-medium text-gray-800">{log.gateId}</td>
                <td className="px-5 py-3.5 text-gray-600">{log.ticketId}</td>
                <td className="px-5 py-3.5 text-gray-600">{ACTION_LABEL[log.action]}</td>
                <td className="px-5 py-3.5">
                  {log.result === "success" ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                      Thành công
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200">
                      Từ chối
                    </span>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  <button
                    onClick={() => onDetail(log)}
                    title="Xem chi tiết"
                    className="text-blue-500 hover:text-blue-700 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-gray-50">
        <p className="text-xs text-gray-400">
          Hiển thị {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} / {total} bản ghi
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                p === page
                  ? "bg-blue-600 text-white"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
