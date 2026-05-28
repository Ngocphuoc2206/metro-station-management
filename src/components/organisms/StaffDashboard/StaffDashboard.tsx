import { useCallback, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { apiClient } from "@features/httpClient/ApiClient";
import { API_ENDPOINTS } from "@features/httpClient/apiEndpoints";

// ── Types ──────────────────────────────────────────────────────────────────
interface ApiDevice {
  id?: string; deviceId?: string; gateId?: string;
  code?: string; gateCode?: string; deviceCode?: string;
  name?: string; type?: string; deviceType?: string; typeName?: string;
  status?: string; stationName?: string;
  [k: string]: unknown;
}
interface ApiStation {
  stationId: string;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  status?: string;
}
interface ApiLiveStationStatus {
  stationId: string;
  status?: string;
  congestionLevel?: number;
  message?: string;
  updatedAt?: string;
}
interface ApiGateLog {
  id: string;
  gateId?: string;
  gateCode?: string;
  stationId?: string;
  stationName?: string;
  ticketId?: string;
  ticketCode?: string;
  action?: string;
  result?: string;
  message?: string;
  scannedAt?: string;
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

function getCode(d: ApiDevice) {
  return d.code ?? d.gateCode ?? d.deviceCode ?? d.name ?? (d.id ?? "").slice(0,8).toUpperCase() ?? "—";
}
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

function toLocalDateTime(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function localDateTimeHoursAgo(hours: number) {
  return toLocalDateTime(new Date(Date.now() - hours * 60 * 60 * 1000));
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

function groupLogsByHour(logs: ApiGateLog[]) {
  return CHART_HOURS.map((startHour) => {
    const bucket = logs.filter((log) => {
      if (!log.scannedAt) return false;
      const hour = new Date(log.scannedAt).getHours();
      return hour >= startHour && hour < startHour + 2;
    });
    return {
      label: `${String(startHour).padStart(2, "0")}:00`,
      inbound: bucket.filter((log) => log.action?.toUpperCase() === "IN").length,
      outbound: bucket.filter((log) => log.action?.toUpperCase() === "OUT").length,
    };
  });
}

export default function StaffDashboard() {
  const [stations, setStations] = useState<ApiStation[]>([]);
  const [devices, setDevices] = useState<ApiDevice[]>([]);
  const [incidents, setIncidents] = useState<ApiIncident[]>([]);
  const [pendingIncidentCount, setPendingIncidentCount] = useState(0);
  const [liveStationStatuses, setLiveStationStatuses] = useState<ApiLiveStationStatus[]>([]);
  const [gateLogs, setGateLogs] = useState<ApiGateLog[]>([]);
  const [chartGateLogs, setChartGateLogs] = useState<ApiGateLog[]>([]);
  const [gates, setGates] = useState<ApiGate[]>([]);
  const [selectedStationId, setSelectedStationId] = useState("");
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [timeWindow, setTimeWindow] = useState<"1h" | "24h" | "7d">("1h");
  const [incidentStatus, setIncidentStatus] = useState("");
  const [incidentPriority, setIncidentPriority] = useState("");
  const [loading, setLoading] = useState(true);
  const [clock, setClock] = useState(getNow());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [chartRange, setChartRange] = useState<"24h"|"7d">("24h");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setClock(getNow()), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const hours = timeWindow === "1h" ? 1 : timeWindow === "24h" ? 24 : 24 * 7;
    const chartHours = chartRange === "24h" ? 24 : 24 * 7;
    const commonParams = {
      stationId: selectedStationId || undefined,
    };
    try {
      const [stationRes, devRes, incRes, pendingIncRes, liveRes, logsRes, chartLogsRes, gatesRes] = await Promise.allSettled([
        apiClient.get<{ results?: ApiStation[] } | ApiStation[]>(API_ENDPOINTS.stations.base),
        apiClient.get<{ results?: ApiDevice[] } | ApiDevice[]>(API_ENDPOINTS.devices.staff),
        apiClient.get<{ results?: ApiIncident[] } | ApiIncident[]>(API_ENDPOINTS.incidents.staff, {
          params: {
            ...commonParams,
            status: incidentStatus || undefined,
            priority: incidentPriority || undefined,
          },
        }),
        apiClient.get<{ results?: ApiIncident[] } | ApiIncident[]>(API_ENDPOINTS.incidents.staff, {
          params: { ...commonParams, status: "PENDING" },
        }),
        apiClient.get<{ results?: ApiLiveStationStatus[] } | ApiLiveStationStatus[]>(
          API_ENDPOINTS.live.stationStatus,
        ),
        apiClient.get<{ results?: ApiGateLog[] } | ApiGateLog[]>(API_ENDPOINTS.gates.logs, {
          params: {
            ...commonParams,
            gateId: selectedDeviceId || undefined,
            from: localDateTimeHoursAgo(hours),
            to: toLocalDateTime(new Date()),
          },
        }),
        apiClient.get<{ results?: ApiGateLog[] } | ApiGateLog[]>(API_ENDPOINTS.gates.logs, {
          params: {
            ...commonParams,
            gateId: selectedDeviceId || undefined,
            from: localDateTimeHoursAgo(chartHours),
            to: toLocalDateTime(new Date()),
          },
        }),
        apiClient.get<{ results?: ApiGate[] } | ApiGate[]>(API_ENDPOINTS.gates.staff),
      ]);
      if (stationRes.status === "fulfilled") {
        setStations(getList(stationRes.value.data));
      }
      if (devRes.status === "fulfilled") {
        setDevices(getList(devRes.value.data));
      }
      if (incRes.status === "fulfilled") {
        setIncidents(getList(incRes.value.data));
      }
      if (pendingIncRes.status === "fulfilled") {
        setPendingIncidentCount(getList(pendingIncRes.value.data).length);
      }
      if (liveRes.status === "fulfilled") {
        setLiveStationStatuses(getList(liveRes.value.data));
      }
      if (logsRes.status === "fulfilled") {
        setGateLogs(getList(logsRes.value.data));
      }
      if (chartLogsRes.status === "fulfilled") {
        setChartGateLogs(getList(chartLogsRes.value.data));
      }
      if (gatesRes.status === "fulfilled") {
        setGates(getList(gatesRes.value.data));
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [chartRange, incidentPriority, incidentStatus, selectedDeviceId, selectedStationId, timeWindow]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Auto refresh every 30s
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchAll, 30000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [autoRefresh, fetchAll]);

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
  const congestionLevel = displayedLiveStatuses.reduce(
    (maximum, station) => Math.max(maximum, station.congestionLevel ?? 0),
    0,
  );
  const stableStationCount = displayedLiveStatuses.filter((station) =>
    isOperationalStatus(station.status),
  ).length;
  const acceptedScans = gateLogs.filter((log) => log.result?.toUpperCase() === "ACCEPTED").length;
  const rejectedScans = gateLogs.filter((log) => log.result?.toUpperCase() === "REJECTED").length;
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
  const recentTransactions = [...gateLogs]
    .sort((left, right) => (right.scannedAt ?? "").localeCompare(left.scannedAt ?? ""))
    .slice(0, 5);

  return (
    <div className="space-y-5 -mt-2">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <nav className="text-xs text-gray-400 mb-0.5 flex items-center gap-1">
            <span>Staff Portal</span>
            <span>›</span>
            <span className="text-blue-600 font-medium">Dashboard</span>
          </nav>
          <h1 className="text-xl font-bold text-gray-900">Tổng quan vận hành</h1>
          <p className="text-xs text-gray-400 mt-0.5">Dữ liệu thời gian thực từ hệ thống</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-bold text-green-600">SYSTEM NORMAL</span>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3 flex-wrap">
        <button className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"/></svg>
          Bộ lọc
        </button>
        <select
          value={selectedStationId}
          onChange={(event) => setSelectedStationId(event.target.value)}
          aria-label="Lọc theo ga"
          className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50 text-gray-700 focus:outline-none"
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
          className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50 text-gray-700 focus:outline-none"
        >
          <option value="">Tất cả thiết bị</option>
          {devices.map((device) => {
            const id = device.id ?? device.deviceId ?? device.gateId;
            if (!id) return null;
            return (
              <option key={id} value={id}>
                {device.name ?? device.deviceCode ?? getCode(device)}
              </option>
            );
          })}
        </select>
        <select
          value={timeWindow}
          onChange={(event) => setTimeWindow(event.target.value as "1h" | "24h" | "7d")}
          aria-label="Lọc theo khoảng thời gian"
          className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50 text-gray-700 focus:outline-none"
        >
          <option value="1h">1 giờ</option>
          <option value="24h">24 giờ</option>
          <option value="7d">7 ngày</option>
        </select>

        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-gray-400 font-mono">Cập nhật: {clock}</span>
          {/* Auto toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-600">Auto</span>
            <button
              onClick={() => setAutoRefresh(v => !v)}
              className={`relative h-5 w-9 rounded-full transition-colors ${autoRefresh ? "bg-blue-600" : "bg-gray-200"}`}
            >
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${autoRefresh ? "left-[18px]" : "left-0.5"}`} />
            </button>
          </div>
          <button
            onClick={fetchAll}
            className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            Refresh
          </button>
        </div>
      </div>

      {/* ── 4 Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Lưu lượng hiện tại", badge: "LIVE", badgeColor: "bg-green-500", value: loading ? "—" : String(congestionLevel), sub: congestionLabel, subColor: congestionLevel >= 50 ? "text-orange-500" : "text-gray-500" },
          { label: "Vé đã quét", badge: "LIVE", badgeColor: "bg-green-500", value: loading ? "—" : String(gateLogs.length), sub: `${acceptedScans} chấp nhận / ${rejectedScans} từ chối`, subColor: "text-gray-500" },
          { label: "Cảnh báo hệ thống", badge: "LIVE", badgeColor: "bg-green-500", value: loading ? "—" : String(pendingIncidentCount).padStart(2,"0"), sub: pendingIncidentCount > 0 ? "Cần xử lý" : "Bình thường", subColor: pendingIncidentCount > 0 ? "text-red-500" : "text-gray-500" },
          { label: "Trạng thái thiết bị/ga", badge: "LIVE", badgeColor: "bg-green-500", value: loading ? "—" : `${stableStationCount}/${displayedLiveStatuses.length}`, sub: stableStationCount === displayedLiveStatuses.length ? "Bình thường" : "Cần kiểm tra", subColor: stableStationCount === displayedLiveStatuses.length ? "text-gray-500" : "text-red-500" },
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
          <div className="flex items-center justify-between mb-4">
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
          <div className="grid grid-cols-3 border-b border-gray-50">
            {[
              { label:"ONLINE",  count: online.length,  color: "text-green-600" },
              { label:"OFFLINE", count: offline.length, color: "text-gray-400" },
              { label:"ALERTS",  count: errorD.length,  color: "text-red-500" },
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
                      ● {st}
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
            <p className="text-[11px] text-gray-400">Time window: {timeWindow}</p>
          </div>
          <Link href="/staff/transaction-logs" className="text-xs font-semibold text-blue-600 hover:text-blue-700">Xem chi tiết</Link>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-50">
              {["Thời gian","Ga","Thiết bị","Ticket Ref","Kết quả"].map(h => (
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
              const accepted = row.result?.toUpperCase() === "ACCEPTED";
              return (
                <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-3.5 font-mono text-blue-500 font-medium">{fmtTime(row.scannedAt)}</td>
                  <td className="px-6 py-3.5 text-gray-700 font-medium">{row.stationName ?? "—"}</td>
                  <td className="px-6 py-3.5 text-gray-600">{row.gateCode ?? row.gateId ?? "—"}</td>
                  <td className="px-6 py-3.5 font-mono text-blue-500">{row.ticketCode ?? row.ticketId ?? "—"}</td>
                  <td className="px-6 py-3.5">
                    <div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded ${accepted ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {row.result ?? "—"}
                      </span>
                      {row.message && <p className="text-[10px] text-gray-400 mt-0.5">{row.message}</p>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
        <table className="w-full text-xs">
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
            ) : incidents.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">Không có sự cố</td></tr>
            ) : (
              incidents.slice(0,5).map((inc) => (
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
  );
}
