import type { GateActivity } from "@features/admin/adminDashboardTypes";

interface Props {
  data: GateActivity[];
}

export default function GateActivityChart({ data }: Props) {
  const max = Math.max(...data.map((d) => d.passengers));

  return (
    <div className="space-y-3 py-2">
      {data.map((gate, i) => {
        const pct = (gate.passengers / max) * 100;
        return (
          <div key={i}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-700 truncate max-w-[160px]">
                {gate.station}
              </span>
              <span className="text-sm font-semibold text-gray-800 ml-2">
                {gate.passengers.toLocaleString("vi-VN")}
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
