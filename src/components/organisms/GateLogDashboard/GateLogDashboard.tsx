import { useState, useMemo } from "react";
import type { GateLog, GateLogFilters } from "@features/gateLog/gateLogTypes";
import { MOCK_GATE_LOGS } from "@features/gateLog/gateLogMockData";
import GateLogFilters from "./GateLogFilters";
import GateLogTable from "./GateLogTable";
import GateLogDetailModal from "./GateLogDetailModal";

const PAGE_SIZE = 8;

function exportCSV(logs: GateLog[]) {
  const header = "ID,Thời gian,Mã cổng,Mã vé,Hành động,Kết quả,Loại vé,Ga\n";
  const rows = logs.map((l) =>
    [l.id, l.timestamp, l.gateId, l.ticketId, l.action, l.result, l.ticketType, l.station].join(",")
  ).join("\n");
  const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `gate-log-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function GateLogDashboard() {
  const [filters, setFilters] = useState<GateLogFilters>({
    timeRange: "all", gateId: "", ticketType: "", result: "",
  });
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<GateLog | null>(null);

  const filtered = useMemo(() => {
    return MOCK_GATE_LOGS.filter((log) => {
      if (filters.gateId && log.gateId !== filters.gateId) return false;
      if (filters.ticketType && log.ticketType !== filters.ticketType) return false;
      if (filters.result && log.result !== filters.result) return false;
      return true;
    });
  }, [filters]);

  // Reset to page 1 when filters change
  const handleFilters = (f: GateLogFilters) => {
    setFilters(f);
    setPage(1);
  };

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <nav className="text-xs text-gray-400 mb-1">
            <span>Nhân viên ga</span>
            <span className="mx-1">›</span>
            <span className="text-gray-600 font-medium">Nhật ký soát vé</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900">Nhật ký soát vé</h1>
        </div>
        <button
          onClick={() => exportCSV(filtered)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-blue-200 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Xuất báo cáo (CSV)
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4">
        <GateLogFilters filters={filters} onChange={handleFilters} />
      </div>

      {/* Summary badge */}
      <div className="flex items-center gap-3 mb-3">
        <p className="text-sm text-gray-500">
          <span className="font-semibold text-gray-900">{filtered.length}</span> bản ghi
        </p>
        <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium">
          ✓ {filtered.filter((l) => l.result === "success").length} thành công
        </span>
        <span className="text-xs bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full font-medium">
          ✗ {filtered.filter((l) => l.result === "rejected").length} từ chối
        </span>
      </div>

      {/* Table */}
      <GateLogTable
        logs={paginated}
        onDetail={setSelectedLog}
        page={page}
        pageSize={PAGE_SIZE}
        total={filtered.length}
        onPageChange={setPage}
      />

      {/* Detail modal */}
      {selectedLog && (
        <GateLogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </div>
  );
}
