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
  try { return new Date(iso).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }); }
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
  const v = st.toUpperCase().replace(/[_\s]/g, "");
  if (v === "OPEN" || v === "NEW" || v === "PENDING") return "bg-blue-100 text-blue-700";
  if (v.includes("PROGRESS")) return "bg-yellow-100 text-yellow-700";
  if (v === "RESOLVED" || v === "CLOSED") return "bg-green-100 text-green-700";
  return "bg-gray-100 text-gray-700";
}
function statusLabel(st: string) {
  const v = st.toUpperCase().replace(/[_\s]/g, "");
  if (v === "OPEN" || v === "NEW") return "MỚI";
  if (v === "PENDING") return "CHỜ XỬ LÝ";
  if (v === "ASSIGNED") return "ĐÃ PHÂN CÔNG";
  if (v.includes("PROGRESS")) return "ĐANG XỬ LÝ";
  if (v === "RESOLVED") return "ĐÃ XONG";
  if (v === "CLOSED") return "ĐÃ ĐÓNG";
  return v;
}

function getNow() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} - ${hh}:${mm}`;
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

  // Draft state — chỉ apply khi nhấn Tìm kiếm
  const todayStr = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  })();
  const [draftDateFrom, setDraftDateFrom] = useState(todayStr);
  const [draftDateTo, setDraftDateTo] = useState(todayStr);
  const [draftStationId, setDraftStationId] = useState("");
  const [draftDeviceId, setDraftDeviceId] = useState("");

  // Applied state — dùng để filter dữ liệu
  const [appliedDateFrom, setAppliedDateFrom] = useState(todayStr);
  const [appliedDateTo, setAppliedDateTo] = useState(todayStr);
  const [appliedStationId, setAppliedStationId] = useState("");
  const [appliedDeviceId, setAppliedDeviceId] = useState("");

  const handleSearch = () => {
    setAppliedDateFrom(draftDateFrom);
    setAppliedDateTo(draftDateTo);
    setAppliedStationId(draftStationId);
    setAppliedDeviceId(draftDeviceId);
    setSelectedStationId(draftStationId);
    setSelectedDeviceId(draftDeviceId);
  };
  const [incidentStatus, setIncidentStatus] = useState("");
  const [incidentPriority, setIncidentPriority] = useState("");
  const [loading, setLoading] = useState(true);
  const [clock, setClock] = useState(getNow());
  const [chartRange, setChartRange] = useState<"24h" | "7d">("24h");
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

  // Auto refresh every 30s
  useEffect(() => {
    intervalRef.current = setInterval(fetchAll, 30000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchAll]);

  const displayedGates = gates.filter(
    (gate) =>
      (!selectedStationId || gate.stationId === selectedStationId) &&
      (!selectedDeviceId || gate.gateId === selectedDeviceId),
  );
  const online = displayedGates.filter((gate) => getGateStatus(gate) === "ONLINE");
  const offline = displayedGates.filter((gate) => getGateStatus(gate) === "OFFLINE");
  const errorD = displayedGates.filter((gate) => getGateStatus(gate) === "ERROR");
  const displayedLiveStatuses = liveStationStatuses.filter(
    (station) => !selectedStationId || station.stationId === selectedStationId,
  );
  const displayedDevices = devices.filter(
    (device) =>
      (!selectedStationId || device.stationId === selectedStationId) &&
      (!selectedDeviceId || device.id === selectedDeviceId),
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
  const selectedLogs = gateLogs.filter((log) => {
    const matchStation = !appliedStationId || log.stationId === appliedStationId;
    const matchDevice = !appliedDeviceId || log.gateId === appliedDeviceId;
    const matchDateFrom = !appliedDateFrom || (log.timestamp ?? "") >= appliedDateFrom;
    const matchDateTo = !appliedDateTo || (log.timestamp ?? "") <= appliedDateTo + "T23:59:59";
    return matchStation && matchDevice && matchDateFrom && matchDateTo;
  });
  const displayedLogs = selectedLogs;
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
      (!incidentPriority || getSev(incident) === incidentPriority),
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
      <div className="flex items-start justify-between">
        <div>
          <nav className="text-xs text-gray-400 mb-0.5 flex items-center gap-1">
            <span>Cổng nhân viên</span>
            <span>›</span>
            <span className="text-blue-600 font-medium">Dashboard</span>
          </nav>
          <h1 className="text-xl font-bold text-gray-900">Tổng quan vận hành</h1>
          <p className="text-xs text-gray-400 mt-0.5">Dữ liệu thời gian thực từ hệ thống</p>
        </div>
        <div />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex items-end gap-4">
        {/* Từ ngày */}
        <div className="flex flex-col gap-1 flex-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Từ ngày</span>
          <input
            type="date"
            value={draftDateFrom}
            max={draftDateTo}
            onChange={(e) => setDraftDateFrom(e.target.value)}
            aria-label="Từ ngày"
            className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-gray-50 text-gray-700 focus:outline-none"
          />
        </div>

        {/* Đến ngày */}
        <div className="flex flex-col gap-1 flex-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Đến ngày</span>
          <input
            type="date"
            value={draftDateTo}
            min={draftDateFrom}
            max={new Date().toISOString().split("T")[0]}
            onChange={(e) => setDraftDateTo(e.target.value)}
            aria-label="Đến ngày"
            className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-gray-50 text-gray-700 focus:outline-none"
          />
        </div>

        {/* Ga */}
        <div className="flex flex-col gap-1 flex-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Ga</span>
          <select
            value={draftStationId}
            onChange={(event) => {
              const stationId = event.target.value;
              setDraftStationId(stationId);
              if (draftDeviceId && !devices.some((d) => d.id === draftDeviceId && (!stationId || d.stationId === stationId))) {
                setDraftDeviceId("");
              }
            }}
            aria-label="Lọc theo ga"
            className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-gray-50 text-gray-700 focus:outline-none"
          >
            <option value="">Tất cả ga</option>
            {stations.map((station) => (
              <option key={station.stationId} value={station.stationId}>
                {station.name}
              </option>
            ))}
          </select>
        </div>

        {/* Thiết bị */}
        <div className="flex flex-col gap-1 flex-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Thiết bị</span>
          <select
            value={draftDeviceId}
            onChange={(event) => setDraftDeviceId(event.target.value)}
            aria-label="Lọc theo thiết bị"
            className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-gray-50 text-gray-700 focus:outline-none"
          >
            <option value="">Tất cả thiết bị</option>
            {devices
              .filter((device) => !draftStationId || device.stationId === draftStationId)
              .map((device) => (
                <option key={device.id} value={device.id}>
                  {device.name}
                </option>
              ))}
          </select>
        </div>

        {/* Nút Tìm kiếm */}
        <div className="flex-shrink-0">
          <button
            type="button"
            onClick={handleSearch}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Tìm kiếm
          </button>
        </div>
      </div>

      {/* Cập nhật lần cuối — bên dưới filter bar, căn phải */}
      <div className="flex justify-end mt-1.5">
        <span className="flex items-center gap-1 text-[10px] text-gray-400">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          Cập nhật lần cuối: {clock}
        </span>
      </div>

      {/* ── 4 Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Lưu lượng hiện tại",
            badge: "LIVE", badgeColor: "bg-green-500",
            value: loading ? "—" : String(currentTraffic),
            sub: congestionLabel,
            subColor: congestionLevel >= 50 ? "text-orange-500" : "text-gray-500",
            icon: (
              <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
              </svg>
            ),
            iconBg: "bg-blue-50",
          },
          {
            label: "Vé đã quét",
            badge: "LIVE", badgeColor: "bg-green-500",
            value: loading ? "—" : String(acceptedScans),
            sub: "Lượt quét thành công",
            subColor: "text-gray-500",
            icon: (
              <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
            iconBg: "bg-green-50",
          },
          {
            label: "Cảnh báo hệ thống",
            badge: "LIVE", badgeColor: "bg-green-500",
            value: loading ? "—" : String(systemAlertCount).padStart(2, "0"),
            sub: systemAlertCount > 0 ? "Cần xử lý" : "Bình thường",
            subColor: systemAlertCount > 0 ? "text-red-500" : "text-gray-500",
            icon: (
              <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            ),
            iconBg: "bg-red-50",
          },
          {
            label: "Trạng thái thiết bị/ga",
            badge: "LIVE", badgeColor: "bg-green-500",
            value: loading ? "—" : `${stableAssetCount}/${displayedAssetCount}`,
            sub: stableAssetCount === displayedAssetCount ? "Bình thường" : "Cần kiểm tra",
            subColor: stableAssetCount === displayedAssetCount ? "text-gray-500" : "text-red-500",
            icon: (
              <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
            iconBg: "bg-orange-50",
          },
        ].map((c, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="mb-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${c.iconBg}`}>
                {c.icon}
              </div>
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
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Biểu đồ lưu lượng theo giờ</h2>
              <p className="text-xs text-gray-400">Tổng lượt vào/ra theo giờ</p>
            </div>
            <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
              {(["24h", "7d"] as const).map(r => (
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
          <div className="grid grid-cols-3 border-b border-gray-50">
            {[
              { label: "TRỰC TUYẾN", count: online.length, color: "text-green-600" },
              { label: "NGOẠI TUYẾN", count: offline.length, color: "text-gray-400" },
              { label: "CẢNH BÁO", count: errorD.length, color: "text-red-500" },
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
              displayedGates.slice(0, 6).map((d, i) => {
                const st = getGateStatus(d);
                return (
                  <div key={i} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2 h-2 rounded-full ${st === "ONLINE" ? "bg-blue-500" : st === "ERROR" ? "bg-red-500" : "bg-gray-300"}`} />
                      <div>
                        <p className="text-xs font-bold text-gray-900">{d.gateCode ?? d.name ?? d.gateId}</p>
                        <p className="text-[10px] text-gray-400">{d.action ?? "Cổng ga"}{d.stationName ? ` - ${d.stationName}` : ""}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-black ${st === "ONLINE" ? "text-green-600" : st === "ERROR" ? "text-red-500" : "text-gray-400"}`}>
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
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
                {["Thời gian", "Ga", "Thiết bị", "Mã vé", "Kết quả"].map(h => (
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
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-gray-50">
          <div className="flex items-center gap-2">
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
                {["Thời gian", "Vị trí", "Loại sự cố", "Mức độ", "Trạng thái"].map(h => (
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
                displayedIncidents.slice(0, 5).map((inc) => (
                  <tr key={inc.id ?? inc.incidentId} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3.5 font-mono text-blue-500 font-medium">{fmtTime(inc.createdAt)}</td>
                    <td className="px-6 py-3.5 text-gray-700 font-medium">{inc.stationName ?? inc.gateCode ?? inc.stationId ?? "—"}</td>
                    <td className="px-6 py-3.5 text-gray-600 max-w-[200px] truncate">{(inc.title ?? inc.description ?? "Sự cố") as string}</td>
                    <td className="px-6 py-3.5"><span className={`text-[10px] font-black px-2 py-0.5 rounded ${sevColor(getSev(inc))}`}>{getSev(inc) === "CRITICAL" ? "NGHIÊM TRỌNG" : getSev(inc) === "HIGH" ? "CAO" : getSev(inc) === "MEDIUM" ? "TRUNG BÌNH" : "THẤP"}</span></td>
                    <td className="px-6 py-3.5"><span className={`text-[10px] font-black px-2 py-0.5 rounded ${statusColor(inc.status ?? "")}`}>{statusLabel(inc.status ?? "")}</span></td>
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
