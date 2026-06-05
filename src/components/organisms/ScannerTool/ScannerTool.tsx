import { useSelector } from "react-redux";
import { useState } from "react";
import { useLogout } from "@features/auth/useLogout";
import type { RootState } from "@stores/index";

type ScanStatus = "idle" | "scanning" | "success" | "error";

const RECENT_SCANS = [
  { id: "T-00421", time: "12:41", status: "valid", gate: "Cổng A1" },
  { id: "T-00420", time: "12:39", status: "valid", gate: "Cổng A1" },
  { id: "T-00419", time: "12:35", status: "expired", gate: "Cổng B2" },
  { id: "T-00418", time: "12:30", status: "valid", gate: "Cổng A1" },
];

export default function ScannerTool() {
  const { name } = useSelector((state: RootState) => state.userReducer);
  const [scanStatus, setScanStatus] = useState<ScanStatus>("idle");
  const handleLogout = useLogout();

  // Simulate scan
  const simulateScan = () => {
    setScanStatus("scanning");
    setTimeout(() => {
      setScanStatus(Math.random() > 0.2 ? "success" : "error");
      setTimeout(() => setScanStatus("idle"), 2000);
    }, 800);
  };

  const statusConfig = {
    idle: {
      bg: "bg-gray-900",
      border: "border-gray-700",
      icon: "📷",
      text: "Sẵn sàng quét",
      sub: "Đặt QR code vào khung quét",
    },
    scanning: {
      bg: "bg-blue-950",
      border: "border-blue-500",
      icon: "⟳",
      text: "Đang quét...",
      sub: "Vui lòng giữ nguyên",
    },
    success: {
      bg: "bg-green-950",
      border: "border-green-500",
      icon: "✓",
      text: "Vé hợp lệ",
      sub: "Cho phép vào",
    },
    error: {
      bg: "bg-red-950",
      border: "border-red-500",
      icon: "✕",
      text: "Vé không hợp lệ",
      sub: "Từ chối — vé hết hạn hoặc đã dùng",
    },
  };

  const cfg = statusConfig[scanStatus];

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm">🚇</div>
          <div>
            <p className="font-semibold text-sm text-white">Gate Scanner Tool</p>
            <p className="text-xs text-gray-400">Cổng A — Ga Bến Thành</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-gray-400">Nhân viên</p>
            <p className="text-sm font-medium text-white">{name}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-gray-500 hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-950/40 border border-gray-800"
          >
            Đăng xuất
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row gap-6 p-6 max-w-5xl mx-auto w-full">
        {/* Scanner view */}
        <div className="flex-1 flex flex-col items-center justify-center">
          {/* QR frame */}
          <div
            className={`w-64 h-64 rounded-2xl border-2 ${cfg.bg} ${cfg.border} flex flex-col items-center justify-center transition-all duration-300 cursor-pointer select-none`}
            onClick={simulateScan}
          >
            {/* Corner marks */}
            <div className="relative w-48 h-48 flex items-center justify-center">
              <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-current opacity-60 rounded-tl-sm" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-current opacity-60 rounded-tr-sm" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-current opacity-60 rounded-bl-sm" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-current opacity-60 rounded-br-sm" />
              <span className={`text-5xl ${scanStatus === "scanning" ? "animate-spin" : ""}`}>{cfg.icon}</span>
            </div>
            <p className="mt-3 text-sm font-semibold">{cfg.text}</p>
            <p className="text-xs text-gray-400 mt-1 text-center px-4">{cfg.sub}</p>
          </div>

          <p className="text-gray-500 text-xs mt-6">Click vào khung để demo quét vé</p>

          {/* Status indicator */}
          <div className="flex items-center gap-2 mt-4">
            <span className={`w-2 h-2 rounded-full ${scanStatus === "idle" ? "bg-green-400 animate-pulse" : scanStatus === "scanning" ? "bg-blue-400 animate-pulse" : scanStatus === "success" ? "bg-green-400" : "bg-red-400"}`} />
            <span className="text-xs text-gray-400">
              {scanStatus === "idle" ? "Camera online" : scanStatus === "scanning" ? "Processing..." : scanStatus === "success" ? "Valid" : "Invalid"}
            </span>
          </div>
        </div>

        {/* Recent scans */}
        <div className="w-full lg:w-72">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white">Lịch sử quét gần đây</h2>
              <span className="text-xs text-gray-500">{RECENT_SCANS.length} lần</span>
            </div>
            <div className="space-y-3">
              {RECENT_SCANS.map((scan) => (
                <div key={scan.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                  <div>
                    <p className="text-xs font-mono font-medium text-white">{scan.id}</p>
                    <p className="text-xs text-gray-500">{scan.gate} · {scan.time}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    scan.status === "valid" ? "bg-green-950 text-green-400" : "bg-red-950 text-red-400"
                  }`}>
                    {scan.status === "valid" ? "Hợp lệ" : "Hết hạn"}
                  </span>
                </div>
              ))}
            </div>

            {/* Today stats */}
            <div className="mt-5 pt-4 border-t border-gray-800 grid grid-cols-2 gap-3">
              <div className="bg-gray-800 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-green-400">248</p>
                <p className="text-xs text-gray-500 mt-0.5">Hợp lệ</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-red-400">12</p>
                <p className="text-xs text-gray-500 mt-0.5">Từ chối</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
