import type { KpiData } from "@features/admin/adminDashboardTypes";
import { Banknote, Activity, Clock, Wrench } from "lucide-react";

function formatVND(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  return n.toLocaleString("vi-VN");
}

function formatTrips(n: number): string {
  return n.toLocaleString("vi-VN");
}

interface Props {
  kpi: KpiData;
  isLoading: boolean;
  error: string | null;
}

function Skeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-100 rounded w-2/3 mb-3" />
      <div className="h-8 bg-gray-200 rounded w-1/2 mb-2" />
      <div className="h-3 bg-gray-100 rounded w-1/3" />
    </div>
  );
}

export default function KpiCards({ kpi, isLoading, error }: Props) {
  if (error) {
    return (
      <div className="col-span-4 bg-red-50 border border-red-200 rounded-2xl p-4 text-red-600 text-sm">
        Không thể tải dữ liệu KPI: {error}
      </div>
    );
  }

  const delta = kpi.revenueChange;
  const deltaColor = delta >= 0 ? "text-green-600" : "text-red-500";
  const deltaLabel = `${delta >= 0 ? "+" : ""}${delta}%`;

  return (
    <>
      {/* Doanh thu hôm nay */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        {isLoading ? (
          <Skeleton />
        ) : (
          <>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Banknote className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Doanh thu 7 ngày gần nhất
              </p>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {formatVND(kpi.revenue)}
            </p>
            <p className="text-sm text-gray-400 mt-0.5">VND</p>
            <span className={`text-xs font-semibold mt-1 inline-block ${deltaColor}`}>
              {deltaLabel}
            </span>
          </>
        )}
      </div>

      {/* Tổng chuyến */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        {isLoading ? (
          <Skeleton />
        ) : (
          <>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                <Activity className="w-4 h-4 text-indigo-600" />
              </div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Tổng chuyến (Hôm nay)
              </p>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {formatTrips(kpi.totalTrips)}
            </p>
            <p className="text-sm text-gray-400 mt-0.5">Lượt đi/về thành công</p>
          </>
        )}
      </div>

      {/* Peak hour */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        {isLoading ? (
          <Skeleton />
        ) : (
          <>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Giờ cao điểm
              </p>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {kpi.peakStart} – {kpi.peakEnd}
            </p>
            <p className="text-sm text-blue-500 mt-0.5">↗ Mật độ cao nhất</p>
          </>
        )}
      </div>

      {/* Cảnh báo hệ thống */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        {isLoading ? (
          <Skeleton />
        ) : (
          <>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                <Wrench className="w-4 h-4 text-red-600" />
              </div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Thiết bị đang bảo trì
              </p>
            </div>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {kpi.criticalAlerts}
            </p>
          </>
        )}
      </div>
    </>
  );
}
