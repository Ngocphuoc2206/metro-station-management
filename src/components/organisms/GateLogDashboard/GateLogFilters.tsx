import type { GateLogs } from "@features/gateLog/gateLogTypes";
import type { GateResponse } from "@features/staffGate/staffGateTypes";

type StationOption = {
  stationId: string;
  name: string;
};

interface Props {
  filters: GateLogs;
  stations: StationOption[];
  gates: GateResponse[];
  loading?: boolean;
  onChange: (filters: GateLogs) => void;
}

function Select({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  disabled?: boolean;
}) {
  return (
    <label className="flex min-w-40 flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function GateLogFilters({ filters, stations, gates, loading, onChange }: Props) {
  const gateOptions = gates.filter((gate) => !filters.stationId || gate.stationId === filters.stationId);

  const set = (key: keyof GateLogs) => (value: string) => {
    if (key === "stationId") {
      onChange({ ...filters, stationId: value, gateId: "" });
      return;
    }

    onChange({ ...filters, [key]: value });
  };

  const hasFilter =
    filters.timeRange !== "all" ||
    filters.stationId ||
    filters.gateId ||
    filters.result;

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm">
      <Select
        label="Thời gian"
        value={filters.timeRange}
        onChange={set("timeRange")}
        disabled={loading}
        options={[
          { label: "Tất cả thời gian", value: "all" },
          { label: "1 giờ qua", value: "1h" },
          { label: "8 giờ qua", value: "8h" },
          { label: "Hôm nay", value: "today" },
        ]}
      />
      <Select
        label="Ga"
        value={filters.stationId}
        onChange={set("stationId")}
        disabled={loading}
        options={[
          { label: "Tất cả ga", value: "" },
          ...stations.map((station) => ({ label: station.name, value: station.stationId })),
        ]}
      />
      <Select
        label="Mã cổng"
        value={filters.gateId}
        onChange={set("gateId")}
        disabled={loading || gateOptions.length === 0}
        options={[
          { label: gateOptions.length === 0 ? "Không có cổng" : "Tất cả cổng", value: "" },
          ...gateOptions.map((gate) => ({
            label: `${gate.gateCode || gate.gateId}${gate.stationName ? ` - ${gate.stationName}` : ""}`,
            value: gate.gateId,
          })),
        ]}
      />
      <Select
        label="Kết quả"
        value={filters.result}
        onChange={set("result")}
        disabled={loading}
        options={[
          { label: "Tất cả kết quả", value: "" },
          { label: "ALLOW", value: "ALLOW" },
          { label: "DENY", value: "DENY" },
        ]}
      />

      {hasFilter ? (
        <button
          type="button"
          onClick={() =>
            onChange({
              timeRange: "all",
              stationId: "",
              gateId: "",
              result: "",
            })
          }
          className="pb-2 text-xs font-semibold text-blue-600 hover:underline"
        >
          Xóa bộ lọc
        </button>
      ) : null}
    </div>
  );
}
