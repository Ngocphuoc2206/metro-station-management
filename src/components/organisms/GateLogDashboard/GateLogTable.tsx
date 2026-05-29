import type { GateLog } from "@features/gateLog/gateLogTypes";

const ACTION_LABEL: Record<string, string> = {
  TAP_IN: "Tap-In",
  TAP_OUT: "Tap-Out",
};

function formatDateTime(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("vi-VN");
}

interface Props {
  logs: GateLog[];
  onDetail: (log: GateLog) => void;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export default function GateLogTable({ logs, onDetail, page, pageSize, total, onPageChange }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (logs.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <svg className="mb-3 h-10 w-10 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-sm">Không có nhật ký phù hợp</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {["Thời gian", "Mã cổng", "Ga", "Mã vé", "Hành động", "Kết quả", "Chi tiết"].map((column) => (
                <th key={column} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {logs.map((log) => (
              <tr key={log.id} className="transition-colors hover:bg-gray-50">
                <td className="whitespace-nowrap px-5 py-3.5 font-mono text-xs text-gray-600">
                  {formatDateTime(log.timestamp)}
                </td>
                <td className="px-5 py-3.5 font-medium text-gray-800">{log.gateCode || log.gateId || "-"}</td>
                <td className="px-5 py-3.5 text-gray-600">{log.stationName || log.stationId || "-"}</td>
                <td className="px-5 py-3.5 font-mono text-blue-600">{log.ticketCode || log.ticketId || "-"}</td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-bold ${
                    log.action === "TAP_IN" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"
                  }`}>
                    {ACTION_LABEL[log.action] ?? log.action}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  {log.result === "ALLOW" ? (
                    <span className="inline-flex rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                      ALLOW
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-600">
                      DENY
                    </span>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  <button
                    type="button"
                    onClick={() => onDetail(log)}
                    title="Xem chi tiết"
                    className="text-blue-500 transition-colors hover:text-blue-700"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-gray-50 px-5 py-3">
        <p className="text-xs text-gray-400">
          Hiển thị {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} / {total} bản ghi
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              onClick={() => onPageChange(pageNumber)}
              className={`h-7 w-7 rounded-lg text-xs font-medium transition-colors ${
                pageNumber === page ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {pageNumber}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
