import type { GateLog } from "@features/gateLog/gateLogTypes";

const ACTION_LABEL: Record<string, string> = {
  TAP_IN: "Vào ga",
  TAP_OUT: "Ra ga",
};

interface Props {
  log: GateLog;
  onClose: () => void;
}

function formatDateTime(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("vi-VN");
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between border-b border-gray-50 py-2.5 last:border-0">
      <span className="text-xs font-medium text-gray-400">{label}</span>
      <span className="max-w-[240px] text-right text-xs font-semibold text-gray-800">{value || "-"}</span>
    </div>
  );
}

export default function GateLogDetailModal({ log, onClose }: Props) {
  const allowed = log.result === "ALLOW";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="mx-4 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">Chi tiết lượt quét</h2>
            <p className="mt-0.5 text-xs text-gray-400">{log.id}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className={`flex items-center gap-2 border-b px-6 py-3 ${
          allowed ? "border-green-100 bg-green-50" : "border-red-100 bg-red-50"
        }`}>
          <span className={`h-2 w-2 flex-shrink-0 rounded-full ${allowed ? "bg-green-500" : "bg-red-500"}`} />
          <span className={`text-sm font-semibold ${allowed ? "text-green-700" : "text-red-700"}`}>
            {allowed ? "Cho phép - Được phép qua cổng" : `Từ chối - ${log.message || "Bị từ chối"}`}
          </span>
        </div>

        <div className="px-6 py-4">
          <Row label="Thời gian" value={formatDateTime(log.timestamp)} />
          <Row label="Mã cổng" value={log.gateCode || log.gateId} />
          <Row label="Mã cổng" value={log.gateId} />
          <Row label="Mã vé" value={log.ticketCode || log.ticketId} />
          <Row label="Mã vé" value={log.ticketId} />
          <Row label="Hành động" value={ACTION_LABEL[log.action] ?? log.action} />
          <Row label="Kết quả" value={log.result} />
          <Row label="Ga" value={log.stationName || log.stationId} />
          {log.message ? <Row label="Thông báo" value={log.message} /> : null}
        </div>

        <div className="border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-gray-900 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
