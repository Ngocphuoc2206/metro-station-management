import type { TimeRange } from "@features/admin/adminDashboardTypes";

const OPTIONS: { label: string; value: TimeRange }[] = [
  { label: "7 ngày", value: "7d" },
  { label: "30 ngày", value: "30d" },
];

interface Props {
  value: TimeRange;
  onChange: (v: TimeRange) => void;
}

export default function TimeFilter({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
            value === opt.value
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
