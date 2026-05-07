import type { Device, ActivityLog } from "@features/device/deviceTypes";

const LOG_DOT: Record<ActivityLog["color"], string> = {
  green:  "bg-green-500",
  blue:   "bg-blue-500",
  orange: "bg-orange-500",
  gray:   "bg-gray-400",
};

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  subColor?: string;
  offline?: boolean;
}

function MetricCard({ icon, label, value, sub, subColor = "text-gray-400", offline }: MetricCardProps) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
        {icon}
        {label}
      </div>
      {offline ? (
        <p className="text-lg font-bold text-gray-300 mt-1">—</p>
      ) : (
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      )}
      <p className={`text-xs font-medium ${offline ? "text-gray-300" : subColor}`}>{offline ? "Offline" : sub}</p>
    </div>
  );
}

interface Props {
  device: Device;
  onClose: () => void;
}

export default function DeviceDetailPanel({ device, onClose }: Props) {
  const isOffline = device.status === "offline";
  const m = device.metrics;

  return (
    <aside className="w-80 min-h-full bg-white border-l border-gray-100 flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900">Chi tiết thiết bị</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Mã: {device.id} •{" "}
            <span className={device.status === "online" ? "text-green-600" : device.status === "error" ? "text-red-500" : "text-gray-400"}>
              {device.status === "online" ? "Online" : device.status === "error" ? "Error" : "Offline"}
            </span>
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors p-0.5 rounded-lg hover:bg-gray-100"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* Offline banner */}
        {isOffline && (
          <div className="flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-xl px-4 py-3">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-400 flex-shrink-0" />
            <p className="text-xs text-gray-500 font-medium">Thiết bị đang offline — dữ liệu không khả dụng</p>
          </div>
        )}

        {/* Metrics */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Thông số kỹ thuật</p>
          <div className="grid grid-cols-2 gap-2.5">
            <MetricCard
              offline={isOffline}
              icon={<CpuIcon />}
              label="CPU Usage"
              value={`${m.cpuUsage}%`}
              sub={m.cpuLabel}
              subColor={m.cpuUsage > 80 ? "text-red-500" : m.cpuUsage > 50 ? "text-amber-500" : "text-green-600"}
            />
            <MetricCard
              offline={isOffline}
              icon={<TempIcon />}
              label="Temp"
              value={`${m.temperature}°C`}
              sub={m.tempLabel}
              subColor={m.temperature > 65 ? "text-red-500" : m.temperature > 50 ? "text-amber-500" : "text-green-600"}
            />
            <MetricCard
              offline={isOffline}
              icon={<MemoryIcon />}
              label="Memory"
              value={`${m.memoryUsed}`}
              sub={`/ ${m.memoryTotal}GB`}
              subColor="text-gray-400"
            />
            <MetricCard
              offline={isOffline}
              icon={<LatencyIcon />}
              label="Latency"
              value={`${m.latency}ms`}
              sub={m.latencyLabel}
              subColor={m.latency > 200 ? "text-red-500" : m.latency > 80 ? "text-amber-500" : "text-green-600"}
            />
          </div>
        </div>

        {/* Activity log */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Nhật ký hoạt động</p>
            <button className="text-xs text-blue-600 hover:underline">Xem tất cả</button>
          </div>
          {device.activityLog.length === 0 ? (
            <p className="text-xs text-gray-400">Không có nhật ký</p>
          ) : (
            <ul className="space-y-3">
              {device.activityLog.map((log) => (
                <li key={log.id} className="flex gap-2.5">
                  <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${LOG_DOT[log.color]}`} />
                  <div>
                    <p className="text-xs font-medium text-gray-800">{log.message}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{log.time} {log.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Footer button */}
      <div className="px-5 py-4 border-t border-gray-100">
        <button className="w-full py-3 bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold rounded-xl transition-colors">
          Xuất báo cáo kỹ thuật
        </button>
      </div>
    </aside>
  );
}

// ── Inline icons ──────────────────────────────────────────────────────────────
function CpuIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2h-2M9 3a2 2 0 002 2h2a2 2 0 002-2M9 3h6" />
    </svg>
  );
}
function TempIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
    </svg>
  );
}
function MemoryIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10M20 7v10M7 4h10M7 20h10M4 4h1M4 20h1M19 4h1M19 20h1" />
    </svg>
  );
}
function LatencyIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}
