import { useState, useMemo, useEffect } from "react";
import type { Device, DeviceCategory, DeviceStatus } from "@features/device/deviceTypes";
import { deviceApi } from "@features/device/deviceApi";
import type { Device as ApiDevice } from "@features/device/deviceApi";
import DeviceTable from "./DeviceTable";
import DeviceDetailPanel from "./DeviceDetailPanel";

const TABS: { label: string; value: DeviceCategory }[] = [
  { label: "Cổng soát vé", value: "gate" },
  { label: "Máy bán vé", value: "ticket-machine" },
  { label: "Máy nạp tiền", value: "top-up" },
];

const STATUS_OPTIONS: { label: string; value: DeviceStatus | "all" }[] = [
  { label: "Tất cả trạng thái", value: "all" },
  { label: "Online", value: "online" },
  { label: "Offline", value: "offline" },
  { label: "Lỗi", value: "error" },
];

// ── Map API Device → UI Device ─────────────────────────────────────────────
function mapApiToUiDevice(d: ApiDevice): Device {
  // category từ type của BE
  const typeRaw = (d.type ?? "").toLowerCase().replace(/[_\s-]/g, "");
  let category: DeviceCategory = "gate";
  if (typeRaw.includes("ticket") || typeRaw.includes("bve") || typeRaw.includes("banve"))
    category = "ticket-machine";
  else if (typeRaw.includes("topup") || typeRaw.includes("naptien") || typeRaw.includes("reload"))
    category = "top-up";

  // status: API dùng "active"/"inactive"/"maintenance", UI dùng "online"/"offline"/"error"
  const statusRaw = (d.status ?? "").toLowerCase();
  let status: DeviceStatus = "offline";
  if (statusRaw === "active" || statusRaw === "online") status = "online";
  else if (statusRaw.includes("error") || statusRaw.includes("fault") || statusRaw === "maintenance")
    status = "error";

  // lastSeen từ lastPing
  let lastSeen = "—";
  if (d.lastPing) {
    try {
      lastSeen = new Date(d.lastPing).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      lastSeen = d.lastPing;
    }
  }

  return {
    id: d.id,
    model: d.name || d.type || "—",
    category,
    status,
    lastSeen,
    station: d.stationName ?? d.stationId ?? "—",
    // metrics & activityLog không có từ API → placeholder
    metrics: {
      cpuUsage: 0,
      cpuLabel: "N/A",
      temperature: 0,
      tempLabel: "N/A",
      memoryUsed: 0,
      memoryTotal: 0,
      latency: 0,
      latencyLabel: "N/A",
    },
    activityLog: [],
  };
}

export default function DeviceDashboard() {
  const [activeTab, setActiveTab] = useState<DeviceCategory>("gate");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<DeviceStatus | "all">("all");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedStatusFilter, setAppliedStatusFilter] = useState<DeviceStatus | "all">("all");
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const raw = await deviceApi.getDevices();
        setDevices(raw.map(mapApiToUiDevice));
      } catch (e) {
        console.error("Lỗi tải danh sách thiết bị:", e);
        setDevices([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    return devices.filter((d) => {
      if (d.category !== activeTab) return false;
      if (appliedStatusFilter !== "all" && d.status !== appliedStatusFilter) return false;
      if (appliedSearch) {
        const q = appliedSearch.toLowerCase();
        if (
          !d.id.toLowerCase().includes(q) &&
          !d.station.toLowerCase().includes(q) &&
          !d.model.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [devices, activeTab, appliedSearch, appliedStatusFilter]);

  const paginatedDevices = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filtered.slice(startIndex, startIndex + pageSize);
  }, [filtered, currentPage]);

  const handleSelect = (device: Device) => {
    setSelectedDevice((prev) => (prev?.id === device.id ? null : device));
  };

  const counts = useMemo(() => {
    const result: Record<DeviceCategory, { total: number; offline: number; error: number }> = {
      gate: { total: 0, offline: 0, error: 0 },
      "ticket-machine": { total: 0, offline: 0, error: 0 },
      "top-up": { total: 0, offline: 0, error: 0 },
    };
    devices.forEach((d) => {
      result[d.category].total++;
      if (d.status === "offline") result[d.category].offline++;
      if (d.status === "error") result[d.category].error++;
    });
    return result;
  }, [devices]);

  return (
    <div className="flex h-full min-h-screen -m-6">
      {/* Main panel */}
      <div className="flex-1 min-w-0 p-6">
        {/* Breadcrumb + title */}
        <div className="mb-6">
          <nav className="text-xs text-gray-400 mb-1">
            <span>Nhân viên ga</span>
            <span className="mx-1">›</span>
            <span className="text-blue-600 font-medium">Thiết bị</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý thiết bị</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-gray-100 mb-5">
          {TABS.map((tab) => {
            const cnt = counts[tab.value];
            const active = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => {
                  setActiveTab(tab.value);
                  setSelectedDevice(null);
                  setSearch("");
                  setStatusFilter("all");
                  setAppliedSearch("");
                  setAppliedStatusFilter("all");
                  setCurrentPage(1);
                }}
                className={`relative px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2 ${active
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-800"
                  }`}
              >
                {tab.label}
                {cnt.total > 0 && (
                  <span className="bg-gray-100 text-gray-600 text-xs font-bold px-1.5 py-0.5 rounded-full">
                    {cnt.total}
                  </span>
                )}
                {(cnt.offline + cnt.error) > 0 && (
                  <span className="bg-red-100 text-red-600 text-xs font-bold px-1.5 py-0.5 rounded-full">
                    {cnt.offline + cnt.error}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1 max-w-xs">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setAppliedSearch(search);
                  setAppliedStatusFilter(statusFilter);
                  setCurrentPage(1);
                }
              }}
              placeholder="Lọc theo mã, vị trí..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as DeviceStatus | "all")}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition cursor-pointer"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              setAppliedSearch(search);
              setAppliedStatusFilter(statusFilter);
              setCurrentPage(1);
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-sm shadow-blue-100"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Tìm kiếm
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400 gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
              <span className="text-sm">Đang tải thiết bị...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium">Không có thiết bị nào</span>
            </div>
          ) : (
            <>
              <DeviceTable
                devices={paginatedDevices}
                selectedId={selectedDevice?.id ?? null}
                onSelect={handleSelect}
              />
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-gray-100 bg-white text-sm">
                <div className="text-gray-500">
                  Hiển thị {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, filtered.length)} trong tổng số {filtered.length} thiết bị
                </div>
                {filtered.length > pageSize && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent transition cursor-pointer"
                      title="Trang trước"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    {Array.from({ length: Math.ceil(filtered.length / pageSize) }).map((_, i) => {
                      const p = i + 1;
                      const isCurrent = p === currentPage;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setCurrentPage(p)}
                          className={`min-w-[32px] h-8 rounded-lg text-sm font-semibold transition cursor-pointer flex items-center justify-center ${
                            isCurrent
                              ? "bg-blue-600 text-white shadow-sm shadow-blue-100"
                              : "text-gray-600 hover:bg-gray-50 border border-transparent hover:border-gray-200"
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      disabled={currentPage === Math.ceil(filtered.length / pageSize)}
                      onClick={() => setCurrentPage((p) => Math.min(Math.ceil(filtered.length / pageSize), p + 1))}
                      className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent transition cursor-pointer"
                      title="Trang sau"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Detail panel */}
      {selectedDevice && (
        <DeviceDetailPanel
          device={selectedDevice}
          onClose={() => setSelectedDevice(null)}
        />
      )}
    </div>
  );
}