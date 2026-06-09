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
    <div className="app-table-scroll">
      <table className="app-table app-table-compact text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {["MÃ THIẾT BỊ", "LOẠI", "TRẠNG THÁI", "THAO TÁC"].map((col) => (
              <th
                key={col}
                className={`px-4 py-3 text-xs font-semibold text-gray-400 tracking-wider ${
                  col === "THAO TÁC" ? "text-center w-[120px]" : "text-left"
                }`}
              >
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
                <td className="px-4 py-3.5 text-center">
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(device);
                      }}
                      className="text-gray-400 hover:text-blue-600 transition"
                      title="Chi tiết"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
