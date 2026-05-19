/* eslint-disable @typescript-eslint/no-explicit-any */
import { Route } from "@features/route/routeTypes";

interface Props {
  route: Route;
  onUpdate: (updates: Partial<Route>) => void;
}

export default function RouteOperatingParams({ route, onUpdate }: Props) {
  return (
    <div className="w-full xl:w-80 flex flex-col gap-6">
      {/* Params Box */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
            />
          </svg>
          <h3 className="font-bold text-gray-900">Thông số vận hành</h3>
        </div>

        {/* Giờ hoạt động */}
        <div>
          <label className="block text-[11px] font-bold text-gray-500 mb-2 uppercase tracking-wider">
            Giờ hoạt động
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={route.startTime}
              onChange={(e) => onUpdate({ startTime: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-center transition-colors"
            />
            <input
              type="text"
              value={route.endTime}
              onChange={(e) => onUpdate({ endTime: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-center transition-colors"
            />
          </div>
        </div>

        {/* Tần suất */}
        <div>
          <label className="block text-[11px] font-bold text-gray-500 mb-2 uppercase tracking-wider">
            Headway (Tần suất)
          </label>
          <div className="relative">
            <input
              type="number"
              value={route.headwayMinutes}
              onChange={(e) =>
                onUpdate({ headwayMinutes: Number(e.target.value) })
              }
              className="w-full pl-4 pr-12 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-colors"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">
              phút
            </span>
          </div>
          <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">
            Thời gian giãn cách giữa các chuyến trong giờ bình thường.
          </p>
        </div>

        {/* Trạng thái tuyến */}
        <div>
          <label className="block text-[11px] font-bold text-gray-500 mb-2 uppercase tracking-wider">
            Trạng thái tuyến
          </label>
          <div className="relative">
            <select
              value={route.status}
              onChange={(e) => onUpdate({ status: e.target.value as any })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 appearance-none focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-colors"
            >
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Tạm dừng</option>
              <option value="maintenance">Dự án</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Info Notice */}
      <div className="bg-blue-50/50 rounded-2xl border border-blue-100 p-5">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-blue-600 shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h4 className="font-bold text-blue-900 text-sm mb-1">
              Lưu ý hệ thống
            </h4>
            <p className="text-xs text-blue-700/80 leading-relaxed">
              Mọi thay đổi về lộ trình hoặc thông số vận hành sẽ trực tiếp ảnh
              hưởng đến thuật toán tính vé và thời gian ước tính trên ứng dụng
              Passenger.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
