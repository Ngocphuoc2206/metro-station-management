import type { KpiData } from "@features/admin/adminDashboardTypes";

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
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                            Doanh thu hôm nay
                        </p>
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
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                            Tổng chuyến (Hôm nay)
                        </p>
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
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                            Peak hour (Giờ cao điểm)
                        </p>
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
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                            Cảnh báo hệ thống
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                            <p className="text-3xl font-bold text-red-600">
                                {kpi.criticalAlerts} Critical
                            </p>
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                        </div>
                        <p className="text-sm text-red-400 mt-0.5">Yêu cầu xử lý ngay</p>
                    </>
                )}
            </div>
        </>
    );
}