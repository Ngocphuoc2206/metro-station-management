import type { GateLogs } from "@features/gateLog/gateLogTypes";
import { GATE_IDS } from "@features/gateLog/gateLogMockData";

interface Props {
  filters: GateLogs;
  onChange: (f: GateLogs) => void;
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <div className="flex flex-col gap-1 min-w-35">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function GateLogFilters({ filters, onChange }: Props) {
  const set = (key: keyof GateLogs) => (val: string) =>
    onChange({ ...filters, [key]: val });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex flex-wrap gap-4 items-end">
      <Select
        label="Thời gian"
        value={filters.timeRange}
        onChange={set("timeRange")}
        options={[
          { label: "Thời gian", value: "all" },
          { label: "1 giờ qua", value: "1h" },
          { label: "8 giờ qua", value: "8h" },
          { label: "Hôm nay", value: "today" },
        ]}
      />
      <Select
        label="Mã cổng"
        value={filters.gateId}
        onChange={set("gateId")}
        options={[
          { label: "Mã cổng", value: "" },
          ...GATE_IDS.map((id) => ({ label: id, value: id })),
        ]}
      />
      <Select
        label="Loại vé"
        value={filters.ticketType}
        onChange={set("ticketType")}
        options={[
          { label: "Loại vé", value: "" },
          { label: "QR Code", value: "qr" },
          { label: "NFC / Thẻ", value: "nfc" },
          { label: "Vé tháng", value: "monthly" },
          { label: "Vé ngày", value: "daily" },
        ]}
      />
      <Select
        label="Kết quả"
        value={filters.result}
        onChange={set("result")}
        options={[
          { label: "Kết quả", value: "" },
          { label: "Thành công", value: "success" },
          { label: "Từ chối", value: "rejected" },
        ]}
      />

      {/* Reset */}
      {(filters.gateId ||
        filters.ticketType ||
        filters.result ||
        filters.timeRange !== "all") && (
        <button
          onClick={() =>
            onChange({
              timeRange: "all",
              gateId: "",
              ticketType: "",
              result: "",
            })
          }
          className="text-xs text-blue-600 hover:underline self-end pb-2"
        >
          Xoá bộ lọc
        </button>
      )}
    </div>
  );
}
