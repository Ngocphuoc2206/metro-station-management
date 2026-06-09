import type { RevenuePoint } from "@features/admin/adminDashboardTypes";

interface Props {
  data: RevenuePoint[];
  isLoading: boolean;
  error: string | null;
}

function SkeletonChart() {
  return (
    <div className="animate-pulse flex flex-col gap-3 h-48 justify-end px-4">
      {[60, 80, 40, 90, 70, 55, 75].map((h, i) => (
        <div key={i} className="absolute" style={{ display: "none" }} />
      ))}
      <svg viewBox="0 0 400 180" className="w-full h-48">
        <polyline
          points="0,140 60,120 120,100 180,80 240,110 300,90 360,60"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export default function RevenueChart({ data, isLoading, error }: Props) {
  if (error) {
    return (
      <div className="h-48 flex items-center justify-center text-red-400 text-sm">
        Không thể tải biểu đồ
      </div>
    );
  }

  if (isLoading || data.length === 0) {
    return <SkeletonChart />;
  }

  const W = 560;
  const H = 180;
  const PADDING = { top: 16, right: 16, bottom: 32, left: 60 };
  const chartW = W - PADDING.left - PADDING.right;
  const chartH = H - PADDING.top - PADDING.bottom;

  const maxVal = Math.max(...data.map((d) => d.value));
  const minVal = 0;

  const toX = (i: number) =>
    PADDING.left + (i / Math.max(data.length - 1, 1)) * chartW;
  const toY = (v: number) =>
    PADDING.top + chartH - ((v - minVal) / (maxVal - minVal || 1)) * chartH;

  const points = data.map((d, i) => `${toX(i)},${toY(d.value)}`).join(" ");

  // Gradient area
  const areaPoints = [
    `${toX(0)},${PADDING.top + chartH}`,
    ...data.map((d, i) => `${toX(i)},${toY(d.value)}`),
    `${toX(data.length - 1)},${PADDING.top + chartH}`,
  ].join(" ");

  // Y-axis labels using standard local number formatting (e.g. 100.000)
  const yTicks = [0, maxVal / 2, maxVal].map((v) => ({
    value: v,
    label: v.toLocaleString("vi-VN"),
    y: toY(v),
  }));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-48">
      <defs>
        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Y grid lines */}
      {yTicks.map((t) => (
        <g key={t.value}>
          <line
            x1={PADDING.left}
            y1={t.y}
            x2={W - PADDING.right}
            y2={t.y}
            stroke="#f3f4f6"
            strokeWidth="1"
          />
          <text
            x={PADDING.left - 6}
            y={t.y + 4}
            textAnchor="end"
            fontSize="10"
            fill="#9ca3af"
          >
            {t.label}
          </text>
        </g>
      ))}

      {/* Area fill */}
      <polygon points={areaPoints} fill="url(#revenueGradient)" />

      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke="#3b82f6"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Data points */}
      {data.map((d, i) => (
        <circle
          key={i}
          cx={toX(i)}
          cy={toY(d.value)}
          r="4"
          fill="#fff"
          stroke="#3b82f6"
          strokeWidth="2"
          className="cursor-pointer"
        >
          <title>{`${d.label}: ${d.value.toLocaleString("vi-VN")} đ`}</title>
        </circle>
      ))}

      {/* X-axis labels: show all for <= 10 items, else space out to prevent overlapping */}
      {data.map((d, i) => {
        const showLabel =
          data.length <= 10 ||
          i === 0 ||
          i === data.length - 1 ||
          i % 5 === 0;

        if (!showLabel) return null;

        return (
          <text
            key={i}
            x={toX(i)}
            y={H - 6}
            textAnchor="middle"
            fontSize="10"
            fill="#9ca3af"
          >
            {d.label}
          </text>
        );
      })}
    </svg>
  );
}

