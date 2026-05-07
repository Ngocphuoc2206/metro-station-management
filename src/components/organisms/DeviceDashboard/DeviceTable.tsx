import type { Device, DeviceStatus } from "@features/device/deviceTypes";

const STATUS_STYLES: Record<DeviceStatus, { dot: string; badge: string; label: string }> = {
  online:  { dot: "bg-green-500",  badge: "bg-green-50 text-green-700 border-green-200",  label: "ONLINE"  },
  error:   { dot: "bg-red-500",    badge: "bg-red-50 text-red-700 border-red-200",         label: "ERROR"   },
  offline: { dot: "bg-gray-400",   badge: "bg-gray-100 text-gray-500 border-gray-200",    label: "OFFLINE" },
};

interface Props {
  devices: Device[];
  selectedId: string | null;
  onSelect: (device: Device) => void;
}

export default function DeviceTable({ devices, selectedId, onSelect }: Props) {
  if (devices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <svg className="w-12 h-12 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
        </svg>
        <p className="text-sm">Không tìm thấy thiết bị</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {["MÃ THIẾT BỊ", "LOẠI", "TRẠNG THÁI", "LAST SEEN"].map((col) => (
              <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 tracking-wider">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {devices.map((device) => {
            const s = STATUS_STYLES[device.status];
            const isSelected = device.id === selectedId;
            return (
              <tr
                key={device.id}
                onClick={() => onSelect(device)}
                className={`cursor-pointer transition-colors ${
                  isSelected ? "bg-blue-50" : "hover:bg-gray-50"
                }`}
              >
                <td className="px-4 py-3.5 font-semibold text-gray-900">{device.id}</td>
                <td className="px-4 py-3.5 text-gray-600">{device.model}</td>
                <td className="px-4 py-3.5">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${s.badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${device.status === "online" ? "animate-pulse" : ""}`} />
                    {s.label}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-gray-500">{device.lastSeen}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
