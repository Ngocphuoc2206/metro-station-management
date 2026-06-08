/* eslint-disable @next/next/no-img-element */
import { CircleAlert, Clock3, Download, X } from "lucide-react";

type PassengerTicketQrModalProps = {
  ticketCode: string;
  qrImageUrl: string | null;
  isRefreshing: boolean;
  error: string | null;
  countdown: string;
  onClose: () => void;
};

export default function PassengerTicketQrModal({
  ticketCode,
  qrImageUrl,
  isRefreshing,
  error,
  countdown,
  onClose,
}: PassengerTicketQrModalProps) {
  const downloadQrImage = () => {
    if (!qrImageUrl) return;

    const link = document.createElement("a");
    link.href = qrImageUrl;
    const normalizedCode = ticketCode.startsWith("#")
      ? ticketCode.slice(1)
      : ticketCode;
    link.download = `metro-qr-${normalizedCode}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-3 backdrop-blur-[2px] sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="my-4 w-full max-w-sm overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Mã QR vào cổng"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-6 sm:py-5">
          <h3 className="text-lg font-bold text-slate-900">Mã QR vào cổng</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl p-1 text-slate-400 transition hover:bg-slate-100"
            aria-label="Đóng mã QR"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-4 pb-5 pt-6 sm:px-6 sm:pb-6 sm:pt-8">
          <div className="mb-5 flex justify-center sm:mb-6">
            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] sm:p-4">
              {qrImageUrl ? (
                <img
                  src={qrImageUrl}
                  alt="Ticket QR"
                  className={`h-40 w-40 sm:h-48 sm:w-48 ${isRefreshing ? "opacity-40" : ""}`}
                />
              ) : (
                <div className="flex h-40 w-40 items-center justify-center rounded-lg bg-slate-50 text-sm font-semibold text-slate-500 sm:h-48 sm:w-48">
                  Đang tải QR...
                </div>
              )}
            </div>
          </div>

          {error ? (
            <div className="mb-6 flex items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
              <CircleAlert className="h-4 w-4 text-red-500" />
              <p className="text-sm font-bold text-red-600">{error}</p>
            </div>
          ) : null}

          <div className="mb-6 text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Mã vé của bạn
            </p>
            <p className="break-all text-xl font-black text-blue-600 sm:text-2xl">{ticketCode}</p>
          </div>

          <div className="mb-6 flex items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
            <CircleAlert className="h-4 w-4 text-red-500" />
            <p className="text-sm font-bold text-red-600">
              {isRefreshing ? "Đang đổi mã QR..." : "Đổi mã mới sau: "}
              {!isRefreshing ? (
                <span className="font-black">{countdown}</span>
              ) : null}
            </p>
          </div>

          <p className="text-center text-sm leading-6 text-slate-500">
            Đưa mã này vào máy quét tại cổng để vào ga
          </p>

          <button
            type="button"
            onClick={downloadQrImage}
            disabled={!qrImageUrl || isRefreshing}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 py-3 text-sm font-bold text-blue-600 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
          >
            <Download className="h-4 w-4" />
            Tải ảnh QR
          </button>
        </div>

        <div className="border-t border-slate-100 bg-slate-50 px-4 py-4 sm:px-6 sm:py-5">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-base font-bold text-white shadow-[0px_10px_15px_-3px_rgba(19,127,236,0.20)]"
          >
            <Clock3 className="h-4 w-4" />
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
