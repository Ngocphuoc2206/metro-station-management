import type { RevenueChartPoint, StationPassengerPoint, HourlyTrafficPoint } from "@features/admin/useReportData";

interface Props {
  revenueData: RevenueChartPoint[];
  stationData: StationPassengerPoint[];
  histogramData: HourlyTrafficPoint[];
}

const chartWidth = 500;
const chartHeight = 180;
const chartPadding = { top: 12, right: 12, bottom: 34, left: 36 };

const toLinePoints = (
  data: RevenueChartPoint[],
  key: "actual" | "forecast",
) => {
  const max = Math.max(...data.map((d) => d[key]), 1);
  const innerWidth = chartWidth - chartPadding.left - chartPadding.right;
  const innerHeight = chartHeight - chartPadding.top - chartPadding.bottom;

  return data
    .map((item, index) => {
      const x =
        chartPadding.left + (index / (data.length - 1 || 1)) * innerWidth;
      const y =
        chartPadding.top + innerHeight - (item[key] / max) * innerHeight;
      return `${x},${y}`;
    })
    .join(" ");
};

export default function ReportDashboardCharts({ revenueData, stationData, histogramData }: Props) {
  const maxStationValue = Math.max(...stationData.map((item) => item.value), 1);
  const maxHistogramValue = Math.max(...histogramData.map((item) => item.val), 1);

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col xl:flex-row gap-6">
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex-[2] relative">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Doanh thu theo thời gian
              </h3>
              <p className="text-xs text-blue-600/80 font-medium">
                Dữ liệu tổng hợp từ các kênh thanh toán
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold text-gray-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                Thực tế
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                Dự báo
              </span>
            </div>
          </div>

          <div className="h-[220px] w-full">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="h-full w-full overflow-visible"
              role="img"
              aria-label="Biểu đồ doanh thu theo thời gian"
            >
              {[0, 25, 50, 75, 100].map((tick) => {
                const y =
                  chartPadding.top +
                  (1 - tick / 100) *
                    (chartHeight - chartPadding.top - chartPadding.bottom);
                return (
                  <g key={tick}>
                    <line
                      x1={chartPadding.left}
                      x2={chartWidth - chartPadding.right}
                      y1={y}
                      y2={y}
                      stroke="#E5E7EB"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={chartPadding.left - 10}
                      y={y + 4}
                      textAnchor="end"
                      className="fill-gray-500 text-[11px]"
                    >
                      {tick}M
                    </text>
                  </g>
                );
              })}

              <polyline
                points={toLinePoints(revenueData, "forecast")}
                fill="none"
                stroke="#D1D5DB"
                strokeWidth="3"
                strokeDasharray="6 6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline
                points={toLinePoints(revenueData, "actual")}
                fill="none"
                stroke="#3B82F6"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {revenueData.map((item, index) => {
                const points = toLinePoints([item], "actual").split(",");
                const x =
                  chartPadding.left +
                  (index / (revenueData.length - 1 || 1)) *
                    (chartWidth - chartPadding.left - chartPadding.right);
                const y =
                  chartPadding.top +
                  (chartHeight - chartPadding.top - chartPadding.bottom) -
                  (item.actual / 100) *
                    (chartHeight - chartPadding.top - chartPadding.bottom);

                return (
                  <g key={item.date}>
                    <circle cx={x} cy={y} r="4" fill="#3B82F6" />
                    <text
                      x={x}
                      y={chartHeight - 8}
                      textAnchor="middle"
                      className="fill-gray-500 text-[11px]"
                    >
                      {item.date}
                    </text>
                    <title>{`${item.date}: ${points.length ? item.actual : item.actual}M`}</title>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex-1">
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900">
              Lưu lượng hành khách theo ga
            </h3>
          </div>

          <div className="h-[180px] w-full flex items-end gap-3">
            {stationData.map((item, index) => (
              <div
                key={item.name}
                className="flex h-full flex-1 flex-col items-center justify-end gap-3"
                title={`${item.name}: ${item.value.toLocaleString("vi-VN")}`}
              >
                <div className="flex h-full w-full items-end justify-center">
                  <div
                    className={`w-full max-w-10 rounded-t ${index === 0 ? "bg-blue-500" : "bg-blue-300"}`}
                    style={{
                      height: `${Math.max((item.value / maxStationValue) * 100, 4)}%`,
                    }}
                  />
                </div>
                <span className="text-[11px] font-medium text-gray-500">
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Histogram lưu lượng theo giờ
            </h3>
            <p className="text-xs text-blue-600/80 font-medium">
              Phân tích mật độ di chuyển trong 24 giờ qua
            </p>
          </div>
          <div className="px-3 py-1.5 bg-blue-50 text-blue-700 text-[11px] font-bold rounded-lg flex items-center gap-1.5">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Cao điểm dự kiến: 07:30 - 08:45
          </div>
        </div>

        <div className="h-[200px] w-full flex items-end gap-1">
          {histogramData.map((item, index) => (
            <div
              key={`${item.time}-${index}`}
              className="flex h-full flex-1 flex-col items-center justify-end gap-2"
              title={`${item.time || `Mốc ${index + 1}`}: ${item.val}`}
            >
              <div className="flex h-full w-full items-end">
                <div
                  className={`w-full rounded-t ${
                    item.val > 220
                      ? "bg-blue-600"
                      : item.val > 150
                        ? "bg-blue-500"
                        : item.val > 80
                          ? "bg-blue-300"
                          : "bg-gray-200"
                  }`}
                  style={{
                    height: `${Math.max((item.val / maxHistogramValue) * 100, 3)}%`,
                  }}
                />
              </div>
              <span className="h-4 text-[11px] font-medium text-gray-500">
                {item.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
