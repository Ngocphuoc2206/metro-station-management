import { useState } from "react";
import type { GateLogs } from "@features/gateLog/gateLogTypes";
import type { GateResponse } from "@features/staffGate/staffGateTypes";

type StationOption = {
  stationId: string;
  name: string;
};

type DeviceOption = {
  deviceId: string;
  name: string;
};

interface Props {
  filters: GateLogs;
  stations: StationOption[];
  gates: GateResponse[];
  devices?: DeviceOption[];
  loading?: boolean;
  onSearch: (filters: GateLogs) => void;
}

function firstDayOfMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

function today(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

const selectCls =
  "rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm text-gray-700 transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400";

const dateCls =
  "rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm text-gray-700 transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400";

export default function GateLogFilters({
  filters,
  stations,
  gates,
  devices = [],
  loading,
  onSearch,
}: Props) {
  const [draft, setDraft] = useState<GateLogs>(filters);

  const gateOptions = gates.filter(
    (gate) => !draft.stationId || gate.stationId === draft.stationId,
  );

  const set = <K extends keyof GateLogs>(key: K, value: GateLogs[K]) => {
    setDraft((prev) => {
      if (key === "stationId") {
        return { ...prev, stationId: value as string, gateId: "" };
      }
      return { ...prev, [key]: value };
    });
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-end gap-3 w-full">

        {/* Từ ngày */}
        <div className="flex flex-col gap-1 flex-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Từ ngày</span>
          <input
            type="date"
            value={draft.dateFrom}
            max={draft.dateTo || today()}
            disabled={loading}
            onChange={(e) => set("dateFrom", e.target.value)}
            className={dateCls}
          />
        </div>

        {/* Đến ngày */}
        <div className="flex flex-col gap-1 flex-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Đến ngày</span>
          <input
            type="date"
            value={draft.dateTo}
            min={draft.dateFrom}
            max={today()}
            disabled={loading}
            onChange={(e) => set("dateTo", e.target.value)}
            className={dateCls}
          />
        </div>

        {/* Ga */}
        <div className="flex flex-col gap-1 flex-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Ga</span>
          <select
            value={draft.stationId}
            disabled={loading}
            onChange={(e) => set("stationId", e.target.value)}
            className={selectCls}
          >
            <option value="">Tất cả ga</option>
            {stations.map((s) => (
              <option key={s.stationId} value={s.stationId}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Cổng */}
        <div className="flex flex-col gap-1 flex-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Cổng</span>
          <select
            value={draft.gateId}
            disabled={loading || gateOptions.length === 0}
            onChange={(e) => set("gateId", e.target.value)}
            className={selectCls}
          >
            <option value="">
              {gateOptions.length === 0 ? "Không có cổng" : "Tất cả cổng"}
            </option>
            {gateOptions.map((gate) => (
              <option key={gate.gateId} value={gate.gateId}>
                {gate.gateCode || gate.gateId}
              </option>
            ))}
          </select>
        </div>

        {/* Thiết bị */}
        <div className="flex flex-col gap-1 flex-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Thiết bị</span>
          <select
            value={draft.deviceId}
            disabled={loading}
            onChange={(e) => set("deviceId", e.target.value)}
            className={selectCls}
          >
            <option value="">Tất cả thiết bị</option>
            {devices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>{d.name}</option>
            ))}
          </select>
        </div>

        {/* Trạng thái */}
        <div className="flex flex-col gap-1 flex-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Trạng thái</span>
          <select
            value={draft.result}
            disabled={loading}
            onChange={(e) => set("result", e.target.value as GateLogs["result"])}
            className={selectCls}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ALLOW">Cho phép</option>
            <option value="DENY">Từ chối</option>
          </select>
        </div>

        {/* Nút Tìm kiếm */}
        <div className="flex flex-col justify-end flex-shrink-0">
          <span className="text-[10px] invisible">x</span>
          <button
            type="button"
            onClick={() => onSearch(draft)}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-100 hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Tìm kiếm
          </button>
        </div>
      </div>
    </div>
  );
}
