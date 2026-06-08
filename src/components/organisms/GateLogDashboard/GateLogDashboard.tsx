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

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toLocalDate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toLocalDateTime(date: Date, endOfDay = false) {
  if (endOfDay) {
    return `${toLocalDate(date)}T23:59:59`;
  }
  return `${toLocalDate(date)}T00:00:00`;
}

function firstDayOfMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
}

function todayStr(): string {
  return toLocalDate(new Date());
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

const DEFAULT_FILTERS: GateLogs = {
  dateFrom: firstDayOfMonth(),
  dateTo: todayStr(),
  stationId: "",
  gateId: "",
  deviceId: "",
  result: "",
};

export default function GateLogDashboard() {
  const [filters, setFilters] = useState<GateLogs>(DEFAULT_FILTERS);
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
      const fromDate = filters.dateFrom
        ? toLocalDateTime(new Date(filters.dateFrom), false)
        : undefined;
      const toDate = filters.dateTo
        ? toLocalDateTime(new Date(filters.dateTo), true)
        : undefined;

      const data = await gateLogApi.getLogs({
        stationId: filters.stationId || undefined,
        gateId: filters.gateId || undefined,
        result: filters.result || undefined,
        from: fromDate,
        to: toDate,
      });

      // Client-side filter by result (backend may not support this reliably)
      const filtered = filters.result
        ? data.filter((log) => log.result === filters.result)
        : data;

      setLogs(filtered.sort((l, r) => (r.timestamp ?? "").localeCompare(l.timestamp ?? "")));
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

  const handleSearch = (nextFilters: GateLogs) => {
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
      </div>

      <div className="mb-4">
        <GateLogFilters
          filters={filters}
          stations={stations}
          gates={gates}
          loading={metaLoading}
          onSearch={handleSearch}
        />
      </div>

      {loading ? (
        <div className="py-10 text-center text-gray-400">Đang tải nhật ký soát vé...</div>
      ) : null}
      {!loading && error ? (
        <div className="py-10 text-center text-red-500">{error}</div>
      ) : null}

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
