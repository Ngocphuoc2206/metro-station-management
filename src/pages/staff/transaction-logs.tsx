import Head from "next/head";
import { useCallback, useEffect, useMemo, useState } from "react";
import StaffLayout from "@components/organisms/StaffDashboard/StaffLayout";
import { withAuth } from "@components/templates/withAuth";
import { apiClient } from "@features/httpClient/ApiClient";
import { API_ENDPOINTS } from "@features/httpClient/apiEndpoints";
import { unwrapApiResponse } from "@features/httpClient/unwrap";
import { staffGateApi, type GateScanLogFilters } from "@features/staffGate/staffGateApi";
import type { GateResponse, GateScanLogResponse } from "@features/staffGate/staffGateTypes";

type StationResponse = {
  stationId: string;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  status?: string;
};

type ResultFilter = "" | "ACCEPTED" | "REJECTED";

type FormFilters = {
  stationId: string;
  gateId: string;
  from: string;
  to: string;
  result: ResultFilter;
};

const emptyFilters: FormFilters = {
  stationId: "",
  gateId: "",
  from: "",
  to: "",
  result: "",
};

function buildApiFilters(filters: FormFilters): GateScanLogFilters {
  return {
    stationId: filters.stationId || undefined,
    gateId: filters.gateId || undefined,
    from: filters.from ? new Date(filters.from).toISOString() : undefined,
    to: filters.to ? new Date(filters.to).toISOString() : undefined,
    result: filters.result || undefined,
  };
}

function formatDateTime(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function isAccepted(result?: string) {
  return ["ACCEPTED", "SUCCESS"].includes((result ?? "").toUpperCase());
}

function formatAction(action?: string) {
  const normalized = (action ?? "").toUpperCase().replace("_", "-");
  if (normalized === "IN" || normalized === "TAP-IN" || normalized === "ENTRY") {
    return "Tap-In";
  }
  if (normalized === "OUT" || normalized === "TAP-OUT" || normalized === "EXIT") {
    return "Tap-Out";
  }
  return action || "-";
}

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function TransactionLogsPage() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [stations, setStations] = useState<StationResponse[]>([]);
  const [gates, setGates] = useState<GateResponse[]>([]);
  const [filters, setFilters] = useState<FormFilters>(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState<GateScanLogFilters>({});
  const [logs, setLogs] = useState<GateScanLogResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterError, setFilterError] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<GateScanLogResponse | null>(null);
  const [page, setPage] = useState(1);

  const availableGates = useMemo(
    () => gates.filter((gate) => !filters.stationId || gate.stationId === filters.stationId),
    [filters.stationId, gates],
  );

  const loadLogs = useCallback(async (params: GateScanLogFilters) => {
    setLoading(true);
    try {
      const data = await staffGateApi.getLogs(params);
      const ordered = [...data].sort(
        (left, right) =>
          new Date(right.scannedAt).getTime() - new Date(left.scannedAt).getTime(),
      );
      setLogs(ordered);
      setError(null);
    } catch {
      setLogs([]);
      setError("Không thể tải lịch sử quét gần đây.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      apiClient.get(API_ENDPOINTS.stations.base),
      apiClient.get(API_ENDPOINTS.gates.staff),
    ])
      .then(([stationResponse, gateResponse]) => {
        if (cancelled) return;
        const stationData = unwrapApiResponse<StationResponse[]>(stationResponse.data);
        const gateData = unwrapApiResponse<GateResponse[]>(gateResponse.data);
        setStations(Array.isArray(stationData) ? stationData : []);
        setGates(Array.isArray(gateData) ? gateData : []);
        setFilterError(null);
      })
      .catch(() => {
        if (!cancelled) setFilterError("Không thể tải danh sách ga hoặc thiết bị.");
      })
      .finally(() => {
        if (!cancelled) setFilterLoading(false);
      });

    loadLogs({});
    return () => {
      cancelled = true;
    };
  }, [loadLogs]);

  useEffect(() => {
    if (!autoRefresh) return;
    const timer = window.setInterval(() => loadLogs(appliedFilters), 30000);
    return () => window.clearInterval(timer);
  }, [appliedFilters, autoRefresh, loadLogs]);

  const applyFilters = () => {
    const params = buildApiFilters(filters);
    setAppliedFilters(params);
    setPage(1);
    loadLogs(params);
  };

  const exportCsv = () => {
    const headers = ["Thời gian", "Ga", "Thiết bị", "Hành động", "Ticket code", "Kết quả", "Lý do"];
    const lines = logs.map((log) =>
      [
        formatDateTime(log.scannedAt),
        log.stationName,
        log.gateCode || log.gateId,
        formatAction(log.action),
        log.ticketCode || log.ticketId,
        log.result,
        log.message || "",
      ].map((value) => csvCell(value || "")).join(","),
    );
    const blob = new Blob([[headers.map(csvCell).join(","), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "gate-scan-logs.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(logs.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = logs.slice((safePage - 1) * pageSize, safePage * pageSize);
  const fromRow = logs.length ? (safePage - 1) * pageSize + 1 : 0;
  const toRow = (safePage - 1) * pageSize + pageRows.length;

  return (
    <>
      <Head><title>Nhật ký giao dịch | MetroNext</title></Head>
      <StaffLayout>
        <div className="w-full max-w-[1400px] space-y-6">
          <div className="space-y-2">
            <nav className="mb-1 text-xs text-gray-400">
              <span>Nhân viên ga</span>
              <span className="mx-1">&gt;</span>
              <span className="font-medium text-blue-600">Lịch sử quét gần đây</span>
            </nav>
            <h1 className="text-2xl font-bold text-slate-900">Lịch sử quét gần đây</h1>
          </div>

          <div className="flex items-center justify-end gap-4">
            <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-2.5 outline outline-1 outline-offset-[-1px] outline-slate-200">
              <span className="text-sm font-semibold text-slate-700">Tự động làm mới</span>
              <button
                type="button"
                onClick={() => setAutoRefresh((value) => !value)}
                className={`relative h-6 w-10 rounded-full transition ${autoRefresh ? "bg-blue-600" : "bg-slate-200"}`}
                aria-label="Bật tắt tự động làm mới"
              >
                <span className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow transition ${autoRefresh ? "left-[18px]" : "left-0.5"}`} />
              </button>
            </div>
            <button
              type="button"
              onClick={exportCsv}
              disabled={logs.length === 0}
              className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-900 outline outline-1 outline-offset-[-1px] outline-slate-200 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              Export CSV
            </button>
          </div>

          <div className="rounded-xl bg-white p-6 outline outline-1 outline-offset-[-1px] outline-slate-200">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-5">
              <label className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-slate-400">Từ ngày</span>
                <input
                  type="datetime-local"
                  value={filters.from}
                  onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))}
                  className="w-full rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-900 outline outline-1 outline-offset-[-1px] outline-slate-200"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-slate-400">Đến ngày</span>
                <input
                  type="datetime-local"
                  value={filters.to}
                  onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))}
                  className="w-full rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-900 outline outline-1 outline-offset-[-1px] outline-slate-200"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-slate-400">Ga</span>
                <select
                  value={filters.stationId}
                  disabled={filterLoading}
                  onChange={(event) => {
                    const stationId = event.target.value;
                    setFilters((current) => ({
                      ...current,
                      stationId,
                      gateId: gates.some((gate) => gate.gateId === current.gateId && (!stationId || gate.stationId === stationId))
                        ? current.gateId
                        : "",
                    }));
                  }}
                  className="w-full rounded-xl bg-slate-50 px-4 py-2 text-sm text-slate-900 outline outline-1 outline-offset-[-1px] outline-slate-200"
                >
                  <option value="">Tất cả các ga</option>
                  {stations.map((station) => (
                    <option key={station.stationId} value={station.stationId}>{station.name}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-slate-400">Thiết bị</span>
                <select
                  value={filters.gateId}
                  disabled={filterLoading}
                  onChange={(event) => setFilters((current) => ({ ...current, gateId: event.target.value }))}
                  className="w-full rounded-xl bg-slate-50 px-4 py-2 text-sm text-slate-900 outline outline-1 outline-offset-[-1px] outline-slate-200"
                >
                  <option value="">Tất cả thiết bị</option>
                  {availableGates.map((gate) => (
                    <option key={gate.gateId} value={gate.gateId}>{gate.gateCode}{gate.name ? ` - ${gate.name}` : ""}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-slate-400">Kết quả</span>
                <select
                  value={filters.result}
                  onChange={(event) => setFilters((current) => ({ ...current, result: event.target.value as ResultFilter }))}
                  className="w-full rounded-xl bg-slate-50 px-4 py-2 text-sm text-slate-900 outline outline-1 outline-offset-[-1px] outline-slate-200"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="ACCEPTED">SUCCESS</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </label>
            </div>
            {filterError ? <p className="mt-4 text-sm font-medium text-red-600">{filterError}</p> : null}
            <button
              type="button"
              onClick={applyFilters}
              className="mt-6 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white"
            >
              Áp dụng bộ lọc
            </button>
          </div>

          <div className="overflow-hidden rounded-xl bg-white outline outline-1 outline-offset-[-1px] outline-slate-200">
            <div className="overflow-x-auto">
              <div className="min-w-[1080px]">
                <div className="grid grid-cols-[12rem_12rem_12rem_8rem_12rem_8rem_1fr] gap-5 border-b border-slate-200 bg-slate-50 px-6 py-4 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  <div>Thời gian</div><div>Ga</div><div>Thiết bị</div><div>Hành động</div>
                  <div>Ticket code</div><div>Kết quả</div><div>Lý do</div>
                </div>
                {loading ? (
                  <div className="px-6 py-10 text-center text-sm text-slate-500">Đang tải lịch sử quét...</div>
                ) : error ? (
                  <div className="px-6 py-10 text-center text-sm font-medium text-red-600">{error}</div>
                ) : pageRows.length === 0 ? (
                  <div className="px-6 py-10 text-center text-sm text-slate-500">Không có lượt quét phù hợp.</div>
                ) : pageRows.map((log) => {
                  const accepted = isAccepted(log.result);
                  const action = formatAction(log.action);
                  return (
                    <button
                      key={log.id}
                      type="button"
                      onClick={() => setSelectedDetail(log)}
                      className="grid w-full grid-cols-[12rem_12rem_12rem_8rem_12rem_8rem_1fr] gap-5 border-b border-slate-100 px-6 py-4 text-left hover:bg-slate-50"
                    >
                      <div className="text-sm text-slate-600">{formatDateTime(log.scannedAt)}</div>
                      <div className="text-sm font-medium text-slate-900">{log.stationName || log.stationId || "-"}</div>
                      <div className="text-sm font-medium text-slate-900">{log.gateCode || log.gateId || "-"}</div>
                      <div><span className={`rounded-md px-2.5 py-1 text-[10px] font-bold uppercase ${action === "Tap-In" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}>{action}</span></div>
                      <div className="font-mono text-sm font-medium text-blue-600">{log.ticketCode || log.ticketId || "-"}</div>
                      <div><span className={`rounded-md px-2.5 py-1 text-[10px] font-bold uppercase ${accepted ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{accepted ? "SUCCESS" : "REJECTED"}</span></div>
                      <div className={`text-sm font-medium ${accepted ? "text-slate-400" : "text-red-600"}`}>{log.message || "-"}</div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center justify-between bg-slate-50 px-6 py-4 text-xs font-medium text-slate-500">
              <span>Hiển thị {fromRow} đến {toRow} trong {logs.length} giao dịch</span>
              <div className="flex items-center gap-2">
                <button type="button" disabled={safePage === 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded-md px-3 py-2 outline outline-1 outline-slate-200 disabled:text-slate-300">Trước</button>
                <span>Trang {safePage}/{totalPages}</span>
                <button type="button" disabled={safePage === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} className="rounded-md px-3 py-2 outline outline-1 outline-slate-200 disabled:text-slate-300">Sau</button>
              </div>
            </div>
          </div>

          {selectedDetail ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4" role="dialog" aria-modal="true" onClick={() => setSelectedDetail(null)}>
              <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white" onClick={(event) => event.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Chi tiết giao dịch</h2>
                    <p className="text-xs text-slate-500">Transaction ID: {selectedDetail.id}</p>
                  </div>
                  <button type="button" onClick={() => setSelectedDetail(null)} className="text-sm font-bold text-slate-500">Đóng</button>
                </div>
                <div className="bg-slate-50 p-6">
                  <pre className="overflow-auto rounded-xl bg-slate-900 p-4 font-mono text-sm text-green-400">{JSON.stringify(selectedDetail, null, 2)}</pre>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </StaffLayout>
    </>
  );
}

export default withAuth(TransactionLogsPage, { allowedRoles: ["staff", "admin"] });
