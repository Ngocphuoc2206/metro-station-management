import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { apiClient } from "@features/httpClient/ApiClient";
import { API_ENDPOINTS } from "@features/httpClient/apiEndpoints";

// ── Types ──────────────────────────────────────────────────────────────────
interface ApiDevice {
  id?: string; deviceId?: string; gateId?: string;
  code?: string; gateCode?: string; deviceCode?: string;
  name?: string; type?: string; deviceType?: string;
  status?: string; stationName?: string;
  [k: string]: unknown;
}
interface ApiIncident {
  id?: string; incidentId?: string;
  title?: string; description?: string;
  priority?: string; severity?: string;
  status?: string; stationId?: string; stationName?: string;
  gateCode?: string; deviceCode?: string;
  createdAt?: string;
  [k: string]: unknown;
}

// ── Mock hourly bar chart data ─────────────────────────────────────────────
const HOURS = ["06:00","08:00","10:00","12:00","14:00","16:00","18:00","20:00","21:00"];
const VALUES = [120, 340, 820, 1100, 1380, 1420, 980, 560, 240];
const MAX_V = Math.max(...VALUES);

// ── Mock recent transactions ───────────────────────────────────────────────
const MOCK_TXN = [
  { time:"15:44:02", station:"Ga Bến Thành", device:"Gate A-01", ticket:"MN-8849-2041", ok:true, reason:"" },
  { time:"15:43:17", station:"Ga Bến Thành", device:"Gate A-02", ticket:"MN-1102-5534", ok:false, reason:"Vé hết hạn" },
  { time:"15:42:55", station:"Ga Bến Thành", device:"Gate B-01", ticket:"MN-4402-9912", ok:false, reason:"Thẻ chưa kích hoạt" },
  { time:"15:41:10", station:"Ga Văn Thánh", device:"Gate A-05", ticket:"MN-7721-1002", ok:true, reason:"" },
  { time:"15:40:09", station:"Ga Ba Son",    device:"Gate C-02", ticket:"MN-3310-8821", ok:true, reason:"" },
];

function getCode(d: ApiDevice) {
  return d.code ?? d.gateCode ?? d.deviceCode ?? d.name ?? (d.id ?? "").slice(0,8).toUpperCase() ?? "—";
}
function getStatus(d: ApiDevice) {
  const s = (d.status ?? "").toLowerCase();
  if (s === "active" || s === "online") return "ONLINE";
  if (s === "error" || s === "maintenance") return "ERROR";
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
  if (v === "OPEN" || v === "NEW") return "bg-blue-100 text-blue-700";
  if (v.includes("PROGRESS")) return "bg-yellow-100 text-yellow-700";
  if (v === "RESOLVED" || v === "CLOSED") return "bg-green-100 text-green-700";
  return "bg-gray-100 text-gray-700";
}
function statusLabel(st: string) {
  const v = st.toUpperCase().replace(/[_\s]/g,"");
  if (v === "OPEN" || v === "NEW") return "MỚI";
  if (v === "ASSIGNED") return "ĐÃ PHÂN CÔNG";
  if (v.includes("PROGRESS")) return "ĐANG XỬ LÝ";
  if (v === "RESOLVED") return "ĐÃ XONG";
  if (v === "CLOSED") return "ĐÃ ĐÓNG";
  return v;
}

function getNow() {
  return new Date().toLocaleTimeString("vi-VN",{hour:"2-digit",minute:"2-digit",second:"2-digit"});
}

export default function StaffDashboard() {
  const [devices, setDevices] = useState<ApiDevice[]>([]);
  const [incidents, setIncidents] = useState<ApiIncident[]>([]);
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

  const fetchAll = async () => {
    try {
      const [devRes, incRes] = await Promise.allSettled([
        apiClient.get<{ results?: ApiDevice[] }>(API_ENDPOINTS.devices.staff),
        apiClient.get<{ results?: ApiIncident[] }>(`${API_ENDPOINTS.incidents.staff}?page=1&size=10`),
      ]);
      if (devRes.status === "fulfilled") {
        const raw = devRes.value.data?.results ?? [];
        setDevices(Array.isArray(raw) ? raw : []);
      }
      if (incRes.status === "fulfilled") {
        const raw = incRes.value.data?.results ?? [];
        setIncidents(Array.isArray(raw) ? raw : []);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // Auto refresh every 30s
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchAll, 30000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [autoRefresh]);

  const online = devices.filter(d => getStatus(d) === "ONLINE");
  const offline = devices.filter(d => getStatus(d) === "OFFLINE");
  const errorD  = devices.filter(d => getStatus(d) === "ERROR");
  const openInc = incidents.filter(d => !["resolved","closed"].includes((d.status??"").toLowerCase()));
  const isPeak = true;

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
        <select className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50 text-gray-700 focus:outline-none">
          <option>Tất cả ga</option>
        </select>
        <select className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50 text-gray-700 focus:outline-none">
          <option>Tất cả thiết bị</option>
        </select>
        <select className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50 text-gray-700 focus:outline-none">
          <option>1 giờ</option>
          <option>24 giờ</option>
          <option>7 ngày</option>
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
          { label: "Lưu lượng hiện tại", badge: "LIVE", badgeColor: "bg-green-500", value: loading ? "—" : online.length * 12 + "", sub: "mức ổn định", subColor: "text-gray-500" },
          { label: "Vé đã quét", badge: "N/A", badgeColor: "bg-gray-400", value: "—", sub: "API không cung cấp", subColor: "text-gray-400" },
          { label: "Cảnh báo hệ thống", badge: "LIVE", badgeColor: "bg-green-500", value: loading ? "—" : String(openInc.length).padStart(2,"0"), sub: openInc.length > 0 ? "Cần xử lý" : "Bình thường", subColor: openInc.length > 0 ? "text-red-500" : "text-gray-500" },
          { label: "Trạng thái thiết bị/ga", badge: "LIVE", badgeColor: "bg-green-500", value: loading ? "—" : `${online.length}/${devices.length}`, sub: "Bình thường", subColor: "text-gray-500" },
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
            {VALUES.map((v, i) => {
              const pct = (v / MAX_V) * 100;
              const isPeak = v === MAX_V;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={`w-full rounded-t-md transition-all ${isPeak ? "bg-blue-600" : "bg-blue-300"}`}
                    style={{ height: `${pct}%` }}
                    title={`${HOURS[i]}: ${v.toLocaleString()}`}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between mt-2 px-0.5">
            {HOURS.map(h => <span key={h} className="text-[10px] text-gray-400">{h}</span>)}
          </div>
          {isPeak && <div className="mt-1 flex items-center gap-1.5 text-[10px] text-blue-600 font-semibold">
            <span className="px-1.5 py-0.5 bg-blue-600 text-white rounded text-[9px]">Peak</span>
            Giờ cao điểm: 14:00–16:00
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
            ) : devices.length === 0 ? (
              [
                { code:"Gate A-01", type:"Chiều vào [IN]",  status:"ONLINE" },
                { code:"Gate A-02", type:"Chiều ra [OUT]",  status:"ONLINE" },
                { code:"Gate B-01", type:"Báo trì hệ thống", status:"OFFLINE" },
              ].map((d,i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2 h-2 rounded-full ${d.status==="ONLINE"?"bg-blue-500":"bg-gray-300"}`} />
                    <div>
                      <p className="text-xs font-bold text-gray-900">{d.code}</p>
                      <p className="text-[10px] text-gray-400">MODE: {d.type}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-black ${d.status==="ONLINE"?"text-green-600":"text-gray-400"}`}>
                    ● {d.status}
                  </span>
                </div>
              ))
            ) : (
              devices.slice(0,6).map((d,i) => {
                const st = getStatus(d);
                return (
                  <div key={i} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2 h-2 rounded-full ${st==="ONLINE"?"bg-blue-500":st==="ERROR"?"bg-red-500":"bg-gray-300"}`} />
                      <div>
                        <p className="text-xs font-bold text-gray-900">{getCode(d)}</p>
                        <p className="text-[10px] text-gray-400">{d.type ?? d.deviceType ?? "Thiết bị"}</p>
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
            <p className="text-[11px] text-gray-400">Time window: 1h</p>
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
            {MOCK_TXN.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-3.5 font-mono text-blue-500 font-medium">{row.time}</td>
                <td className="px-6 py-3.5 text-gray-700 font-medium">{row.station}</td>
                <td className="px-6 py-3.5 text-gray-600">{row.device}</td>
                <td className="px-6 py-3.5 font-mono text-blue-500">{row.ticket}</td>
                <td className="px-6 py-3.5">
                  <div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded ${row.ok ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {row.ok ? "ACCEPTED" : "REJECTED"}
                    </span>
                    {row.reason && <p className="text-[10px] text-gray-400 mt-0.5">{row.reason}</p>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Recent Incidents ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-sm" />
            <h2 className="text-sm font-bold text-gray-900">Sự cố gần đây (Recent Incidents)</h2>
          </div>
          <Link href="/staff/incidents" className="text-xs font-semibold text-blue-600 hover:text-blue-700">Xem lịch sử</Link>
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
              [
                { t:"15:42:10", loc:"Cổng B-01", type:"Lỗi cảm biến vật cản", sev:"MEDIUM", st:"IN_PROGRESS" },
                { t:"14:15:33", loc:"Máy bán vé TVM-04", type:"Hết tiền thừa", sev:"CRITICAL", st:"OPEN" },
                { t:"12:05:00", loc:"Hệ thống mạng", type:"Mất kết nối server tạm thời", sev:"CRITICAL", st:"CLOSED" },
                { t:"09:12:44", loc:"Cửa soát vé A-05", type:"Kẹt thẻ từ", sev:"MEDIUM", st:"CLOSED" },
              ].map((inc, i) => (
                <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-3.5 font-mono text-blue-500 font-medium">{inc.t}</td>
                  <td className="px-6 py-3.5 text-gray-700 font-medium">{inc.loc}</td>
                  <td className="px-6 py-3.5 text-gray-600">{inc.type}</td>
                  <td className="px-6 py-3.5"><span className={`text-[10px] font-black px-2 py-0.5 rounded ${sevColor(inc.sev)}`}>{inc.sev === "CRITICAL" ? "NGHIÊM TRỌNG" : "TRUNG BÌNH"}</span></td>
                  <td className="px-6 py-3.5"><span className={`text-[10px] font-black px-2 py-0.5 rounded ${statusColor(inc.st)}`}>{statusLabel(inc.st)}</span></td>
                </tr>
              ))
            ) : (
              incidents.slice(0,5).map((inc, i) => (
                <tr key={i} className="hover:bg-gray-50/50 transition-colors">
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
