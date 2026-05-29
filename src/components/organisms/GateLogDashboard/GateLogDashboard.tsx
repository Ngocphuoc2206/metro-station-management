import { useCallback, useEffect, useMemo, useState } from "react";
import { apiClient } from "@features/httpClient/ApiClient";
import { API_ENDPOINTS } from "@features/httpClient/apiEndpoints";
import { unwrapApiResponse } from "@features/httpClient/unwrap";
import type { GateLog, GateLogs } from "@features/gateLog/gateLogTypes";
import { gateLogApi } from "@features/gateLog/gateLogApi";
import { staffGateApi } from "@features/staffGate/staffGateApi";
import type { GateResponse } from "@features/staffGate/staffGateTypes";
import GateLogTable from "./GateLogTable";
import GateLogDetailModal from "./GateLogDetailModal";
import GateLogFilters from "./GateLogFilters";

const PAGE_SIZE = 8;

type StationOption = {
  stationId: string;
  name: string;
};

function toLocalDateTime(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function timeRangeParams(timeRange: GateLogs["timeRange"]) {
  const now = new Date();
  if (timeRange === "1h") {
    return { from: toLocalDateTime(new Date(now.getTime() - 60 * 60 * 1000)), to: toLocalDateTime(now) };
  }
  if (timeRange === "8h") {
    return { from: toLocalDateTime(new Date(now.getTime() - 8 * 60 * 60 * 1000)), to: toLocalDateTime(now) };
  }
  if (timeRange === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return { from: toLocalDateTime(start), to: toLocalDateTime(now) };
  }
  return {};
}

function csvValue(value: unknown) {
  const text = value === undefined || value === null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function exportCSV(logs: GateLog[]) {
  const header = ["ID", "Thời gian", "Mã cổng", "Ga", "Mã vé", "Hành động", "Kết quả", "Thông báo"];
  const rows = logs.map((log) => [
    log.id,
    log.timestamp,
    log.gateCode || log.gateId,
    log.stationName || log.stationId,
    log.ticketCode || log.ticketId,
    log.action,
    log.result,
    log.message ?? "",
  ]);
  const csv = [header, ...rows].map((row) => row.map(csvValue).join(",")).join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `gate-log-${Date.now()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function GateLogDashboard() {
  const [filters, setFilters] = useState<GateLogs>({
    timeRange: "all",
    stationId: "",
    gateId: "",
    result: "",
  });
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<GateLog | null>(null);
  const [logs, setLogs] = useState<GateLog[]>([]);
  const [stations, setStations] = useState<StationOption[]>([]);
  const [gates, setGates] = useState<GateResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [metaLoading, setMetaLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setMetaLoading(true);

    Promise.allSettled([
      apiClient.get(API_ENDPOINTS.stations.base),
      staffGateApi.getGates(),
    ])
      .then(([stationResult, gateResult]) => {
        if (cancelled) return;

        if (stationResult.status === "fulfilled") {
          const stationData = unwrapApiResponse<StationOption[]>(stationResult.value.data);
          setStations(Array.isArray(stationData) ? stationData : []);
        }

        if (gateResult.status === "fulfilled") {
          setGates(gateResult.value);
        }
      })
      .finally(() => {
        if (!cancelled) setMetaLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const timeParams = timeRangeParams(filters.timeRange);
      const data = await gateLogApi.getLogs({
        stationId: filters.stationId || undefined,
        gateId: filters.gateId || undefined,
        result: filters.result || undefined,
        ...timeParams,
      });
      setLogs(data.sort((left, right) => (right.timestamp ?? "").localeCompare(left.timestamp ?? "")));
      setError(null);
    } catch {
      setLogs([]);
      setError("Không thể tải nhật ký soát vé. Vui lòng kiểm tra quyền STAFF/ADMIN hoặc thử lại.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleFilters = (nextFilters: GateLogs) => {
    setFilters(nextFilters);
    setPage(1);
  };

  const paginated = useMemo(
    () => logs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [logs, page],
  );

  const allowCount = logs.filter((log) => log.result === "ALLOW").length;
  const denyCount = logs.filter((log) => log.result === "DENY").length;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <nav className="mb-1 text-xs text-gray-400">
            <span>Nhân viên ga</span>
            <span className="mx-1">›</span>
            <span className="font-medium text-gray-600">Nhật ký soát vé</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900">Nhật ký soát vé</h1>
        </div>
        <button
          type="button"
          onClick={() => exportCSV(logs)}
          disabled={loading || logs.length === 0}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Xuất CSV
        </button>
      </div>

      <div className="mb-4">
        <GateLogFilters
          filters={filters}
          stations={stations}
          gates={gates}
          loading={metaLoading || loading}
          onChange={handleFilters}
        />
      </div>

      {loading ? (
        <div className="py-10 text-center text-gray-400">Đang tải nhật ký soát vé...</div>
      ) : null}
      {!loading && error ? (
        <div className="py-10 text-center text-red-500">{error}</div>
      ) : null}

      <div className="mb-3 flex items-center gap-3">
        <p className="text-sm text-gray-500">
          <span className="font-semibold text-gray-900">{logs.length}</span> bản ghi
        </p>
        <span className="rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
          ALLOW {allowCount}
        </span>
        <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
          DENY {denyCount}
        </span>
      </div>

      {!error ? (
        <GateLogTable
          logs={paginated}
          onDetail={setSelectedLog}
          page={page}
          pageSize={PAGE_SIZE}
          total={logs.length}
          onPageChange={setPage}
        />
      ) : null}

      {selectedLog ? (
        <GateLogDetailModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      ) : null}
    </div>
  );
}
