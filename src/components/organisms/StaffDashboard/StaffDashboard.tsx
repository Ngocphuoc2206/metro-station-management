import { useCallback, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { apiClient } from "@features/httpClient/ApiClient";
import { API_ENDPOINTS } from "@features/httpClient/apiEndpoints";
import { deviceApi, type Device } from "@features/device/deviceApi";
import { gateLogApi, type GateLog } from "@features/gateLog/gateLogApi";
import { liveApi } from "@features/live/liveApi";
import type { LiveStationStatusDto } from "@features/live/liveTypes";

// ── Types ──────────────────────────────────────────────────────────────────
interface ApiStation {
  stationId: string;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  status?: string;
}
interface ApiGate {
  gateId: string;
  gateCode: string;
  name?: string;
  stationId?: string;
  stationName?: string;
  action?: string;
  status?: string;
}
interface ApiIncident {
  id?: string; incidentId?: string;
  title?: string; description?: string;
  priority?: string; severity?: string;
  status?: string; stationId?: string; stationName?: string;
  gateId?: string; gateCode?: string;
  deviceId?: string; deviceCode?: string;
  reporterName?: string; assigneeName?: string;
  createdAt?: string; updatedAt?: string;
  [k: string]: unknown;
}

const CHART_HOURS = Array.from({ length: 12 }, (_, index) => index * 2);

function getGateStatus(gate: ApiGate) {
  const status = (gate.status ?? "").toUpperCase();
  if (status === "ACTIVE" || status === "ONLINE") return "ONLINE";
  if (status === "ERROR" || status === "MAINTENANCE") return "ERROR";
  return "OFFLINE";
}
function fmtTime(iso?: string) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleTimeString("vi-VN",{hour:"2-digit",minute:"2-digit",second:"2-digit"}); }
  catch { return iso; }
}
function getSev(inc: ApiIncident) {
  return ((inc.priority ?? inc.severity ?? "LOW")).toUpperCase();
}
function sevColor(sev: string) {
  if (sev === "CRITICAL") return "bg-red-100 text-red-700";
  if (sev === "HIGH") return "bg-orange-100 text-orange-700";
  if (sev === "MEDIUM") return "bg-yellow-100 text-yellow-700";
  return "bg-blue-100 text-blue-700";
}
function statusColor(st: string) {
  const v = st.toUpperCase().replace(/[_\s]/g,"");
  if (v === "OPEN" || v === "NEW" || v === "PENDING") return "bg-blue-100 text-blue-700";
  if (v.includes("PROGRESS")) return "bg-yellow-100 text-yellow-700";
  if (v === "RESOLVED" || v === "CLOSED") return "bg-green-100 text-green-700";
  return "bg-gray-100 text-gray-700";
}
function statusLabel(st: string) {
  const v = st.toUpperCase().replace(/[_\s]/g,"");
  if (v === "OPEN" || v === "NEW") return "MỚI";
  if (v === "PENDING") return "CHỜ XỬ LÝ";
  if (v === "ASSIGNED") return "ĐÃ PHÂN CÔNG";
  if (v.includes("PROGRESS")) return "ĐANG XỬ LÝ";
  if (v === "RESOLVED") return "ĐÃ XONG";
  if (v === "CLOSED") return "ĐÃ ĐÓNG";
  return v;
}

function getNow() {
  return new Date().toLocaleTimeString("vi-VN",{hour:"2-digit",minute:"2-digit",second:"2-digit"});
}

function getList<T>(data: { results?: T[] } | T[]): T[] {
  if (Array.isArray(data)) return data;
  return Array.isArray(data.results) ? data.results : [];
}

function isOperationalStatus(status?: string) {
  const value = (status ?? "").toUpperCase();
  return (
    value === "ACTIVE" ||
    value === "ONLINE" ||
    value.includes("NORMAL") ||
    value.includes("OPERATIONAL")
  );
}

function isOperationalDevice(device: Device) {
  return device.status.toUpperCase() === "ACTIVE";
}

function isOpenIncident(incident: ApiIncident) {
  const status = (incident.status ?? "").toUpperCase().replace(/[_\s-]/g, "");
  return status !== "RESOLVED" && status !== "CLOSED";
}

function filterLogsByHours(logs: GateLog[], hours: number) {
  const cutoff = Date.now() - hours * 60 * 60 * 1000;
  return logs.filter((log) => {
    const scannedAt = new Date(log.timestamp).getTime();
    return Number.isNaN(scannedAt) || scannedAt >= cutoff;
  });
}

function groupLogsByHour(logs: GateLog[]) {
  return CHART_HOURS.map((startHour) => {
    const bucket = logs.filter((log) => {
      if (!log.timestamp) return false;
      const hour = new Date(log.timestamp).getHours();
      return hour >= startHour && hour < startHour + 2;
    });
    return {
      label: `${String(startHour).padStart(2, "0")}:00`,
      inbound: bucket.filter((log) => log.action === "TAP_IN").length,
      outbound: bucket.filter((log) => log.action === "TAP_OUT").length,
    };
  });
}

export default function StaffDashboard() {
  const [stations, setStations] = useState<ApiStation[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [incidents, setIncidents] = useState<ApiIncident[]>([]);
  const [liveStationStatuses, setLiveStationStatuses] = useState<LiveStationStatusDto[]>([]);
  const [gateLogs, setGateLogs] = useState<GateLog[]>([]);
  const [gates, setGates] = useState<ApiGate[]>([]);
  const [selectedStationId, setSelectedStationId] = useState("");
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [timeWindow, setTimeWindow] = useState<"1h" | "24h" | "7d">("1h");
  const [incidentStatus, setIncidentStatus] = useState("");
  const [incidentPriority, setIncidentPriority] = useState("");
  const [loading, setLoading] = useState(true);
  const [clock, setClock] = useState(getNow());
  const [chartRange, setChartRange] = useState<"24h"|"7d">("24h");
  const [searchQuery, setSearchQuery] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setClock(getNow()), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [stationRes, devRes, incRes, liveRes, logsRes, gatesRes] = await Promise.allSettled([
        apiClient.get<{ results?: ApiStation[] } | ApiStation[]>(API_ENDPOINTS.stations.base),
        deviceApi.getDevices(),
        apiClient.get<{ results?: ApiIncident[] } | ApiIncident[]>(API_ENDPOINTS.incidents.staff),
        liveApi.getStationStatuses(),
        gateLogApi.getLogs(),
        apiClient.get<{ results?: ApiGate[] } | ApiGate[]>(API_ENDPOINTS.gates.staff),
      ]);
      if (stationRes.status === "fulfilled") {
        setStations(getList(stationRes.value.data));
      }
      if (devRes.status === "fulfilled") {
        setDevices(devRes.value);
      }
      if (incRes.status === "fulfilled") {
        setIncidents(getList(incRes.value.data));
      }
      if (liveRes.status === "fulfilled") {
        setLiveStationStatuses(liveRes.value);
      }
      if (logsRes.status === "fulfilled") {
        setGateLogs(logsRes.value);
      }
      if (gatesRes.status === "fulfilled") {
        setGates(getList(gatesRes.value.data));
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    intervalRef.current = setInterval(fetchAll, 30000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchAll]);

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const getStationName = (stationId?: string) =>
    stations.find((station) => station.stationId === stationId)?.name ?? "";
  const matchesSearch = (...values: Array<string | undefined>) =>
    !normalizedSearch ||
    values.some((value) => (value ?? "").toLowerCase().includes(normalizedSearch));

  const displayedGates = gates.filter(
    (gate) =>
      (!selectedStationId || gate.stationId === selectedStationId) &&
      (!selectedDeviceId || gate.gateId === selectedDeviceId) &&
      matchesSearch(gate.gateId, gate.gateCode, gate.name, gate.stationName, getStationName(gate.stationId)),
  );
  const online = displayedGates.filter((gate) => getGateStatus(gate) === "ONLINE");
  const offline = displayedGates.filter((gate) => getGateStatus(gate) === "OFFLINE");
  const errorD = displayedGates.filter((gate) => getGateStatus(gate) === "ERROR");
  const displayedLiveStatuses = liveStationStatuses.filter(
    (station) =>
      (!selectedStationId || station.stationId === selectedStationId) &&
      matchesSearch(station.stationId, getStationName(station.stationId), station.status),
  );
  const displayedDevices = devices.filter(
    (device) =>
      (!selectedStationId || device.stationId === selectedStationId) &&
      (!selectedDeviceId || device.id === selectedDeviceId) &&
      matchesSearch(device.id, device.name, device.type, device.stationName, getStationName(device.stationId)),
  );
  const congestionLevel = displayedLiveStatuses.reduce(
    (maximum, station) => Math.max(maximum, station.congestionLevel ?? 0),
    0,
  );
  const stableStationCount = displayedLiveStatuses.filter((station) =>
    isOperationalStatus(station.status),
  ).length;
  const stableDeviceCount = displayedDevices.filter(isOperationalDevice).length;
  const stableAssetCount = stableStationCount + stableDeviceCount;
  const displayedAssetCount = displayedLiveStatuses.length + displayedDevices.length;
  const selectedLogs = gateLogs.filter(
    (log) =>
      (!selectedStationId || log.stationId === selectedStationId) &&
      (!selectedDeviceId || log.gateId === selectedDeviceId) &&
      matchesSearch(log.gateId, log.gateCode, log.ticketId, log.ticketCode, log.stationName, getStationName(log.stationId)),
  );
  const displayedLogs = filterLogsByHours(selectedLogs, timeWindow === "1h" ? 1 : timeWindow === "24h" ? 24 : 24 * 7);
  const acceptedLogs = displayedLogs.filter((log) => log.result === "ALLOW");
  const currentTraffic = Math.max(
    0,
    acceptedLogs.filter((log) => log.action === "TAP_IN").length -
      acceptedLogs.filter((log) => log.action === "TAP_OUT").length,
  );
  const displayedIncidents = incidents.filter(
    (incident) =>
      (!selectedStationId || incident.stationId === selectedStationId) &&
      (!incidentStatus || incident.status?.toUpperCase() === incidentStatus) &&
      (!incidentPriority || getSev(incident) === incidentPriority) &&
      matchesSearch(
        incident.title,
        incident.description,
        incident.stationName,
        getStationName(incident.stationId),
        incident.gateId,
        incident.gateCode,
        incident.deviceId,
        incident.deviceCode,
      ),
  );
  const systemAlertCount =
    displayedIncidents.filter(isOpenIncident).length +
    displayedDevices.filter((device) => !isOperationalDevice(device)).length;
  const chartGateLogs = filterLogsByHours(selectedLogs, chartRange === "24h" ? 24 : 24 * 7)
    .filter((log) => log.result === "ALLOW");
  const acceptedScans = acceptedLogs.length;
  const congestionLabel =
    congestionLevel >= 80 ? "Mức rất đông" : congestionLevel >= 50 ? "Mức đông" : "Mức ổn định";
  const chartPoints = groupLogsByHour(chartGateLogs);
  const chartMax = Math.max(
    1,
    ...chartPoints.map((point) => Math.max(point.inbound, point.outbound)),
  );
  const peakPoint = chartPoints.reduce(
    (peak, point) =>
      point.inbound + point.outbound > peak.inbound + peak.outbound ? point : peak,
    chartPoints[0],
  );
  const recentTransactions = [...selectedLogs]
    .sort((left, right) => (right.timestamp ?? "").localeCompare(left.timestamp ?? ""))
    .slice(0, 5);

  return (
    <div className="space-y-5 -mt-2">
      {/* ── Header ── */}
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row">
        <div>
          <nav className="text-xs text-gray-400 mb-0.5 flex items-center gap-1">
            <span>Cổng nhân viên</span>
            <span>›</span>
            <span className="text-blue-600 font-medium">Dashboard</span>
          </nav>
          <h1 className="text-xl font-bold text-gray-900">Tổng quan vận hành</h1>
          <p className="text-xs text-gray-400 mt-0.5">Dữ liệu thời gian thực từ hệ thống</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-bold text-green-600">HỆ THỐNG ỔN ĐỊNH</span>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"/></svg>
          Bộ lọc
        </div>
        <div className="relative min-w-0 flex-1 basis-full sm:basis-auto">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Tìm ga, thiết bị, cổng, mã vé..."
            className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-800 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <select
          value={selectedStationId}
          onChange={(event) => {
            const stationId = event.target.value;
            setSelectedStationId(stationId);
            if (
              selectedDeviceId &&
              !devices.some(
                (device) =>
                  device.id === selectedDeviceId &&
                  (!stationId || device.stationId === stationId),
              )
            ) {
              setSelectedDeviceId("");
            }
          }}
          aria-label="Lọc theo ga"
          className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 sm:w-auto sm:min-w-40"
        >
          <option value="">Tất cả ga</option>
          {stations.map((station) => (
            <option key={station.stationId} value={station.stationId}>
              {station.name}
            </option>
          ))}
        </select>
        <select
          value={selectedDeviceId}
          onChange={(event) => setSelectedDeviceId(event.target.value)}
          aria-label="Lọc theo thiết bị"
          className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 sm:w-auto sm:min-w-44"
        >
          <option value="">Tất cả thiết bị</option>
          {devices
            .filter((device) => !selectedStationId || device.stationId === selectedStationId)
            .map((device) => (
              <option key={device.id} value={device.id}>
                {device.name}
              </option>
            ))}
        </select>
        <select
          value={timeWindow}
          onChange={(event) => setTimeWindow(event.target.value as "1h" | "24h" | "7d")}
          aria-label="Lọc theo khoảng thời gian"
          className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 sm:w-auto"
        >
          <option value="1h">1 giờ</option>
          <option value="24h">24 giờ</option>
          <option value="7d">7 ngày</option>
        </select>

        <div className="flex h-10 w-full items-center rounded-xl bg-gray-50 px-3 sm:ml-auto sm:w-auto">
          <span className="text-xs text-gray-400 font-mono">Cập nhật: {clock}</span>
        </div>
      </div>

      {/* ── 4 Stat Cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Lưu lượng hiện tại", badge: "LIVE", badgeColor: "bg-green-500", value: loading ? "—" : String(currentTraffic), sub: congestionLabel, subColor: congestionLevel >= 50 ? "text-orange-500" : "text-gray-500" },
          { label: "Vé đã quét", badge: "LIVE", badgeColor: "bg-green-500", value: loading ? "—" : String(acceptedScans), sub: "Lượt quét thành công", subColor: "text-gray-500" },
          { label: "Cảnh báo hệ thống", badge: "LIVE", badgeColor: "bg-green-500", value: loading ? "—" : String(systemAlertCount).padStart(2,"0"), sub: systemAlertCount > 0 ? "Cần xử lý" : "Bình thường", subColor: systemAlertCount > 0 ? "text-red-500" : "text-gray-500" },
          { label: "Trạng thái thiết bị/ga", badge: "LIVE", badgeColor: "bg-green-500", value: loading ? "—" : `${stableAssetCount}/${displayedAssetCount}`, sub: stableAssetCount === displayedAssetCount ? "Bình thường" : "Cần kiểm tra", subColor: stableAssetCount === displayedAssetCount ? "text-gray-500" : "text-red-500" },
        ].map((c, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-7 h-7 rounded-lg bg-blue-100" style={{ background: i === 0 ? "#dbeafe" : i === 2 ? "#fee2e2" : i === 3 ? "#d1fae5" : "#f3f4f6" }} />
              <span className={`text-[10px] font-black px-2 py-0.5 rounded text-white ${c.badgeColor}`}>{c.badge}</span>
            </div>
            <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide mb-1">{c.label}</p>
            <p className="text-2xl font-black text-gray-900">{c.value}</p>
            <p className={`text-xs font-medium mt-1 ${c.subColor}`}>{c.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Chart + Gate Status ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Biểu đồ lưu lượng theo giờ</h2>
              <p className="text-xs text-gray-400">Tổng lượt vào/ra theo giờ</p>
            </div>
            <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
              {(["24h","7d"] as const).map(r => (
                <button key={r} onClick={() => setChartRange(r)}
                  className={`text-xs font-bold px-2.5 py-1 rounded-md transition ${chartRange === r ? "bg-white shadow text-blue-600" : "text-gray-400 hover:text-gray-600"}`}>
                  {r === "24h" ? "24h" : "7 ngày"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-end gap-2 h-36">
            {chartPoints.map((point) => (
              <div key={point.label} className="flex-1 flex items-end justify-center gap-0.5 h-full">
                <div
                  className="w-1/2 rounded-t-sm bg-blue-600 transition-all"
                  style={{ height: `${(point.inbound / chartMax) * 100}%` }}
                  title={`${point.label} - Vao: ${point.inbound}`}
                />
                <div
                  className="w-1/2 rounded-t-sm bg-blue-300 transition-all"
                  style={{ height: `${(point.outbound / chartMax) * 100}%` }}
                  title={`${point.label} - Ra: ${point.outbound}`}
                />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-2 px-0.5">
            {chartPoints.map((point) => <span key={point.label} className="text-[10px] text-gray-400">{point.label}</span>)}
          </div>
          {chartGateLogs.length > 0 && <div className="mt-1 flex items-center gap-3 text-[10px] text-blue-600 font-semibold">
            <span className="px-1.5 py-0.5 bg-blue-600 text-white rounded text-[9px]">Peak</span>
            Cao điểm: {peakPoint.label}
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-blue-600" /> Vào</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-blue-300" /> Ra</span>
          </div>}
        </div>

        {/* Gate Status Panel */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between border-b border-gray-50">
            <h2 className="text-sm font-bold text-gray-900">Trạng thái cổng ga</h2>
            <Link href="/staff/devices" className="text-xs font-semibold text-blue-600 hover:text-blue-700">Tất cả</Link>
          </div>
          {/* Counters */}
          <div className="grid grid-cols-1 border-b border-gray-50 sm:grid-cols-3">
            {[
               { label:"TRỰC TUYẾN",  count: online.length,  color: "text-green-600" },
               { label:"NGOẠI TUYẾN", count: offline.length, color: "text-gray-400" },
               { label:"CẢNH BÁO",  count: errorD.length,  color: "text-red-500" },
            ].map(c => (
              <div key={c.label} className="py-3 text-center">
                <p className={`text-lg font-black ${c.color}`}>{loading ? "—" : c.count}</p>
                <p className="text-[10px] text-gray-400 font-bold">{c.label}</p>
              </div>
            ))}
          </div>
          {/* Device list */}
          <div className="divide-y divide-gray-50 max-h-[200px] overflow-y-auto">
            {loading ? (
              <div className="py-6 text-center text-xs text-gray-400">Đang tải...</div>
            ) : displayedGates.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-400">Không có cổng ga</div>
            ) : (
              displayedGates.slice(0,6).map((d,i) => {
                const st = getGateStatus(d);
                return (
                  <div key={i} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2 h-2 rounded-full ${st==="ONLINE"?"bg-blue-500":st==="ERROR"?"bg-red-500":"bg-gray-300"}`} />
                      <div>
                        <p className="text-xs font-bold text-gray-900">{d.gateCode ?? d.name ?? d.gateId}</p>
                        <p className="text-[10px] text-gray-400">{d.action ?? "Cổng ga"}{d.stationName ? ` - ${d.stationName}` : ""}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-black ${st==="ONLINE"?"text-green-600":st==="ERROR"?"text-red-500":"text-gray-400"}`}>
                      ● {st === "ONLINE" ? "Trực tuyến" : st === "ERROR" ? "Lỗi" : "Ngoại tuyến"}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Recent Transactions ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex flex-col gap-2 border-b border-gray-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Giao dịch gần đây</h2>
              <p className="text-[11px] text-gray-400">5 giao dịch mới nhất</p>
          </div>
          <Link href="/staff/transaction-logs" className="text-xs font-semibold text-blue-600 hover:text-blue-700">Xem chi tiết</Link>
        </div>
        <div className="app-table-scroll">
        <table className="app-table app-table-compact text-xs">
          <thead>
            <tr className="border-b border-gray-50">
              {["Thời gian","Ga","Thiết bị","Mã vé","Kết quả"].map(h => (
                <th key={h} className="px-6 py-3 text-left font-bold text-blue-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">Đang tải...</td></tr>
            ) : recentTransactions.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">Không có giao dịch</td></tr>
            ) : recentTransactions.map((row) => {
              const accepted = ["ALLOW", "ACCEPTED", "SUCCESS"].includes(row.result?.toUpperCase() ?? "");
              return (
                <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-3.5 font-mono text-blue-500 font-medium">{fmtTime(row.timestamp)}</td>
                  <td className="px-6 py-3.5 text-gray-700 font-medium">{row.stationName ?? "—"}</td>
                  <td className="px-6 py-3.5 text-gray-600">{row.gateCode ?? row.gateId ?? "—"}</td>
                  <td className="px-6 py-3.5 font-mono text-blue-500">{row.ticketCode ?? row.ticketId ?? "—"}</td>
                  <td className="px-6 py-3.5">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded ${accepted ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {accepted ? "Thành công" : "Từ chối"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>

      {/* ── Recent Incidents ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-gray-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-sm" />
            <h2 className="text-sm font-bold text-gray-900">Sự cố gần đây (Recent Incidents)</h2>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={incidentStatus}
              onChange={(event) => setIncidentStatus(event.target.value)}
              aria-label="Lọc sự cố theo trạng thái"
              className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-gray-50 text-gray-700 focus:outline-none"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="PENDING">Chờ xử lý</option>
              <option value="OPEN">Mới</option>
              <option value="IN_PROGRESS">Đang xử lý</option>
              <option value="RESOLVED">Đã xong</option>
              <option value="CLOSED">Đã đóng</option>
            </select>
            <select
              value={incidentPriority}
              onChange={(event) => setIncidentPriority(event.target.value)}
              aria-label="Lọc sự cố theo mức độ"
              className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-gray-50 text-gray-700 focus:outline-none"
            >
              <option value="">Tất cả mức độ</option>
              <option value="CRITICAL">Nghiêm trọng</option>
              <option value="HIGH">Cao</option>
              <option value="MEDIUM">Trung bình</option>
              <option value="LOW">Thấp</option>
            </select>
            <Link href="/staff/incidents" className="text-xs font-semibold text-blue-600 hover:text-blue-700">Xem lịch sử</Link>
          </div>
        </div>
        <div className="app-table-scroll">
        <table className="app-table app-table-compact text-xs">
          <thead>
            <tr className="border-b border-gray-50">
              {["Thời gian","Vị trí","Loại sự cố","Mức độ","Trạng thái"].map(h => (
                <th key={h} className="px-6 py-3 text-left font-bold text-blue-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">Đang tải...</td></tr>
            ) : displayedIncidents.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">Không có sự cố</td></tr>
            ) : (
              displayedIncidents.slice(0,5).map((inc) => (
                <tr key={inc.id ?? inc.incidentId} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-3.5 font-mono text-blue-500 font-medium">{fmtTime(inc.createdAt)}</td>
                  <td className="px-6 py-3.5 text-gray-700 font-medium">{inc.stationName ?? inc.gateCode ?? inc.stationId ?? "—"}</td>
                  <td className="px-6 py-3.5 text-gray-600 max-w-[200px] truncate">{(inc.title ?? inc.description ?? "Sự cố") as string}</td>
                  <td className="px-6 py-3.5"><span className={`text-[10px] font-black px-2 py-0.5 rounded ${sevColor(getSev(inc))}`}>{getSev(inc) === "CRITICAL" ? "NGHIÊM TRỌNG" : getSev(inc) === "HIGH" ? "CAO" : getSev(inc) === "MEDIUM" ? "TRUNG BÌNH" : "THẤP"}</span></td>
                  <td className="px-6 py-3.5"><span className={`text-[10px] font-black px-2 py-0.5 rounded ${statusColor(inc.status??"")}`}>{statusLabel(inc.status??"")}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
