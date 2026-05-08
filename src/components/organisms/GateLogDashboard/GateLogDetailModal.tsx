import type { GateLog } from "@features/gateLog/gateLogTypes";

const ACTION_LABEL: Record<string, string> = { enter: "Vào", exit: "Ra" };
const TICKET_LABEL: Record<string, string> = {
  qr: "QR Code", nfc: "NFC / Thẻ", monthly: "Vé tháng", daily: "Vé ngày",
};

interface Props {
  log: GateLog;
  onClose: () => void;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 font-medium">{label}</span>
      <span className="text-xs text-gray-800 font-semibold text-right max-w-[200px]">{value}</span>
    </div>
  );
}

export default function GateLogDetailModal({ log, onClose }: Props) {
  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Chi tiết giao dịch</h2>
            <p className="text-xs text-gray-400 mt-0.5">{log.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Result banner */}
        <div className={`px-6 py-3 flex items-center gap-2 ${
          log.result === "success" ? "bg-green-50 border-b border-green-100" : "bg-red-50 border-b border-red-100"
        }`}>
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${log.result === "success" ? "bg-green-500" : "bg-red-500"}`} />
          <span className={`text-sm font-semibold ${log.result === "success" ? "text-green-700" : "text-red-700"}`}>
            {log.result === "success" ? "Giao dịch thành công" : `Từ chối — ${log.rejectionReason ?? "Không xác định"}`}
          </span>
        </div>

        {/* Detail rows */}
        <div className="px-6 py-4">
          <Row label="Thời gian" value={log.timestamp} />
          <Row label="Mã cổng" value={log.gateId} />
          <Row label="Mã vé" value={log.ticketId} />
          <Row label="Loại vé" value={TICKET_LABEL[log.ticketType]} />
          <Row label="Hành động" value={ACTION_LABEL[log.action]} />
          <Row label="Ga" value={log.station} />
          {log.passengerName && <Row label="Hành khách" value={log.passengerName} />}
          {log.transactionMs !== undefined && (
            <Row label="Thời gian xử lý" value={`${log.transactionMs} ms`} />
          )}
          {log.deviceFirmware && <Row label="Firmware thiết bị" value={log.deviceFirmware} />}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
