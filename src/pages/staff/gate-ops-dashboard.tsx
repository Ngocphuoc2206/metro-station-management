import Head from "next/head";
import StaffPortalShell from "@components/templates/StaffPortalShell";
import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Filter } from "lucide-react";

type GateStatus = {
  gate: string;
  mode: string;
  status: "ONLINE" | "OFFLINE";
  tone: "blue" | "slate";
};

type Incident = {
  time: string;
  location: string;
  type: string;
  severity: {
    label: string;
    tone: "orange" | "red";
  };
  state: {
    label: string;
    tone: "blue" | "slate" | "green";
  };
};

type RecentTxn = {
  time: string;
  station: string;
  device: string;
  ticketRef: string;
  result: "ACCEPTED" | "REJECTED";
  reason?: string;
};

const gateStatuses: GateStatus[] = [
  { gate: "Gate A-01", mode: "Mode: Chiều vào (IN)", status: "ONLINE", tone: "blue" },
  { gate: "Gate A-02", mode: "Mode: Chiều ra (OUT)", status: "ONLINE", tone: "blue" },
  { gate: "Gate B-01", mode: "Bảo trì hệ thống", status: "OFFLINE", tone: "slate" },
];

const incidents: Incident[] = [
  {
    time: "15:42:10",
    location: "Cổng B-01",
    type: "Lỗi cảm biến vật cản",
    severity: { label: "Trung bình", tone: "orange" },
    state: { label: "Đang xử lý", tone: "blue" },
  },
  {
    time: "14:15:33",
    location: "Máy bán vé TVM-04",
    type: "Hết tiền thừa",
    severity: { label: "Nghiêm trọng", tone: "red" },
    state: { label: "Mới", tone: "slate" },
  },
  {
    time: "12:05:00",
    location: "Hệ thống mạng",
    type: "Mất kết nối server tạm thời",
    severity: { label: "Nghiêm trọng", tone: "red" },
    state: { label: "Đã xong", tone: "green" },
  },
  {
    time: "09:12:44",
    location: "Cửa soát vé A-05",
    type: "Kẹt thẻ từ",
    severity: { label: "Trung bình", tone: "orange" },
    state: { label: "Đã xong", tone: "green" },
  },
];

const recentTransactions: RecentTxn[] = [
  {
    time: "15:44:02",
    station: "Ga Bến Thành",
    device: "Gate A-01",
    ticketRef: "MN-8849-2041",
    result: "ACCEPTED",
  },
  {
    time: "15:43:17",
    station: "Ga Bến Thành",
    device: "Gate A-02",
    ticketRef: "MN-1102-5534",
    result: "REJECTED",
    reason: "Vé hết hạn",
  },
  {
    time: "15:42:55",
    station: "Ga Bến Thành",
    device: "Gate B-01",
    ticketRef: "MN-4402-9912",
    result: "REJECTED",
    reason: "Thẻ chưa kích hoạt",
  },
  {
    time: "15:41:10",
    station: "Ga Văn Thánh",
    device: "Gate A-05",
    ticketRef: "MN-7721-1002",
    result: "ACCEPTED",
  },
  {
    time: "15:40:09",
    station: "Ga Ba Son",
    device: "Gate C-02",
    ticketRef: "MN-3310-8821",
    result: "ACCEPTED",
  },
];

const tonePills = {
  severity: {
    orange: "bg-orange-100 text-orange-700",
    red: "bg-red-100 text-red-700",
  },
  state: {
    blue: "bg-blue-100 text-blue-700",
    slate: "bg-slate-100 text-slate-700",
    green: "bg-green-100 text-green-700",
  },
} as const;

export default function GateOpsDashboardPage() {
  const [stationFilter, setStationFilter] = useState("all");
  const [deviceFilter, setDeviceFilter] = useState("all");
  const [timeWindow, setTimeWindow] = useState<"15m" | "1h" | "24h">("1h");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(() =>
    new Date().toLocaleTimeString("vi-VN", { hour12: false }),
  );

  useEffect(() => {
    if (!autoRefresh) return;
    const id = window.setInterval(() => {
      setLastUpdatedAt(new Date().toLocaleTimeString("vi-VN", { hour12: false }));
    }, 15000);
    return () => window.clearInterval(id);
  }, [autoRefresh]);

  const filteredTxns = useMemo(() => {
    return recentTransactions.filter((t) => {
      const stationOk = stationFilter === "all" ? true : t.station === stationFilter;
      const deviceOk = deviceFilter === "all" ? true : t.device === deviceFilter;
      return stationOk && deviceOk;
    });
  }, [deviceFilter, stationFilter]);

  const deviceHealth = useMemo(() => {
    // Mocked summary: reusing gateStatuses + a fixed alert/offline assumption.
    const online = gateStatuses.filter((g) => g.status === "ONLINE").length;
    const offline = gateStatuses.filter((g) => g.status === "OFFLINE").length;
    const alert = 1;
    return { online, offline, alert, total: online + offline + alert };
  }, []);

  return (
    <>
      <Head>
        <title>Gate Ops Dashboard | MetroNext</title>
      </Head>

      <StaffPortalShell breadcrumb={{ section: "Staff Portal", page: "Dashboard" }}>
        <div className="mx-auto w-full max-w-[1280px] space-y-8">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold leading-9 text-slate-900">Tổng quan vận hành</h1>
            <p className="text-sm font-normal leading-5 text-slate-500">
              Dữ liệu thời gian thực từ hệ thống Ga Bến Thành (L1)
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-white p-4 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline outline-1 outline-offset-[-1px] outline-slate-200">
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 outline outline-1 outline-offset-[-1px] outline-slate-200">
                <Filter className="h-4 w-4 text-slate-500" aria-hidden="true" />
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Bộ lọc</span>
              </div>

              <select
                value={stationFilter}
                onChange={(e) => setStationFilter(e.target.value)}
                className="h-10 w-44 appearance-none rounded-2xl bg-slate-50 px-4 text-sm text-slate-900 outline outline-1 outline-offset-[-1px] outline-slate-200"
              >
                <option value="all">Tất cả ga</option>
                <option value="Ga Bến Thành">Ga Bến Thành</option>
                <option value="Ga Ba Son">Ga Ba Son</option>
                <option value="Ga Văn Thánh">Ga Văn Thánh</option>
              </select>

              <select
                value={deviceFilter}
                onChange={(e) => setDeviceFilter(e.target.value)}
                className="h-10 w-44 appearance-none rounded-2xl bg-slate-50 px-4 text-sm text-slate-900 outline outline-1 outline-offset-[-1px] outline-slate-200"
              >
                <option value="all">Tất cả thiết bị</option>
                <option value="Gate A-01">Gate A-01</option>
                <option value="Gate A-02">Gate A-02</option>
                <option value="Gate B-01">Gate B-01</option>
                <option value="Gate A-05">Gate A-05</option>
              </select>

              <select
                value={timeWindow}
                onChange={(e) => setTimeWindow(e.target.value as "15m" | "1h" | "24h")}
                className="h-10 w-32 appearance-none rounded-2xl bg-slate-50 px-4 text-sm text-slate-900 outline outline-1 outline-offset-[-1px] outline-slate-200"
              >
                <option value="15m">15 phút</option>
                <option value="1h">1 giờ</option>
                <option value="24h">24 giờ</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-xs font-medium text-slate-500">Cập nhật: {lastUpdatedAt}</div>
              <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 outline outline-1 outline-offset-[-1px] outline-slate-200">
                <span className="text-sm font-semibold leading-5 text-slate-700">Auto</span>
                <button
                  type="button"
                  onClick={() => setAutoRefresh((v) => !v)}
                  className={`relative h-6 w-10 rounded-full transition ${autoRefresh ? "bg-blue-600" : "bg-slate-200"}`}
                  aria-label="Toggle auto refresh"
                >
                  <span
                    className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow transition ${
                      autoRefresh ? "left-[18px]" : "left-[2px]"
                    }`}
                  />
                </button>
              </div>
              <button
                type="button"
                onClick={() => setLastUpdatedAt(new Date().toLocaleTimeString("vi-VN", { hour12: false }))}
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-bold leading-5 text-white"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Refresh
              </button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-4">
            <article className="relative rounded-3xl bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline outline-1 outline-offset-[-1px] outline-slate-200">
              <div className="absolute left-5 top-5 flex w-44 items-start justify-between">
                <div className="rounded-2xl bg-blue-50 p-2">
                  <div className="h-4 w-5 rounded bg-blue-600" aria-hidden="true" />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold leading-4 text-green-500">+12%</span>
                  <span className="h-1.5 w-3 rounded bg-green-500" aria-hidden="true" />
                </div>
              </div>
              <div className="absolute left-5 top-[77px] w-44">
                <p className="text-xs font-bold uppercase leading-4 tracking-wide text-slate-500">
                  Lưu lượng hiện tại
                </p>
              </div>
              <div className="absolute left-5 top-[97px] h-8 w-44">
                <span className="absolute left-0 top-[-0.5px] text-2xl font-bold leading-8 text-slate-900">
                  1,284
                </span>
                <span className="absolute left-[71px] top-[8.5px] text-sm font-normal leading-5 text-slate-400">
                  ng/giờ
                </span>
              </div>
              <div className="h-[152px]" />
            </article>

            <article className="relative rounded-3xl bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline outline-1 outline-offset-[-1px] outline-slate-200">
              <div className="absolute left-5 top-5 flex w-44 items-start justify-between">
                <div className="rounded-2xl bg-purple-50 p-2">
                  <div className="h-4 w-4 rounded bg-purple-600" aria-hidden="true" />
                </div>
                <span className="text-xs font-bold leading-4 text-slate-400">Hôm nay</span>
              </div>
              <div className="absolute left-5 top-[77px] w-44">
                <p className="text-xs font-bold uppercase leading-4 tracking-wide text-slate-500">
                  Vé đã quét (Hôm nay)
                </p>
              </div>
              <div className="absolute left-5 top-[97px] w-44">
                <span className="text-2xl font-bold leading-8 text-slate-900">24,502</span>
              </div>
              <div className="h-[152px]" />
            </article>

            <article className="relative rounded-3xl bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline outline-1 outline-offset-[-1px] outline-slate-200">
              <div className="absolute left-5 top-5 flex w-44 items-start justify-between">
                <div className="rounded-2xl bg-red-50 p-2">
                  <div className="h-5 w-5 rounded bg-red-600" aria-hidden="true" />
                </div>
                <div className="rounded-full bg-red-100 px-2 py-0.5">
                  <span className="text-[10px] font-bold leading-4 text-red-600">2 LỖI</span>
                </div>
              </div>
              <div className="absolute left-5 top-[77px] w-44">
                <p className="text-xs font-bold uppercase leading-4 tracking-wide text-slate-500">
                  Cảnh báo hệ thống
                </p>
              </div>
              <div className="absolute left-5 top-[97px] w-44">
                <span className="text-2xl font-bold leading-8 text-slate-900">02</span>
              </div>
              <div className="h-[152px]" />
            </article>

            <article className="relative rounded-3xl bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline outline-1 outline-offset-[-1px] outline-slate-200">
              <div className="absolute left-5 top-5 flex w-44 items-start justify-between">
                <div className="rounded-2xl bg-green-50 p-2">
                  <div className="h-3.5 w-5 rounded bg-green-600" aria-hidden="true" />
                </div>
                <span className="text-xs font-bold leading-4 text-green-500">98% Online</span>
              </div>
              <div className="absolute left-5 top-[77px] w-44">
                <p className="text-xs font-bold uppercase leading-4 tracking-wide text-slate-500">
                  Trạng thái thiết bị
                </p>
              </div>
              <div className="absolute left-5 top-[97px] h-8 w-44">
                <span className="absolute left-0 top-[-0.5px] text-2xl font-bold leading-8 text-slate-900">
                  48/50
                </span>
                <span className="absolute left-[78px] top-[8.5px] text-sm font-normal leading-5 text-slate-400">
                  Hoạt động
                </span>
              </div>
              <div className="h-[152px]" />
            </article>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_384px]">
            <section className="rounded-3xl bg-white p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline outline-1 outline-offset-[-1px] outline-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold leading-7 text-slate-900">Biểu đồ lưu lượng theo giờ</h2>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-2xl bg-slate-100 px-3 py-1 text-xs font-semibold leading-4 text-slate-900"
                  >
                    24h
                  </button>
                  <button
                    type="button"
                    className="rounded-2xl px-3 py-1 text-xs font-semibold leading-4 text-slate-500"
                  >
                    7 ngày
                  </button>
                </div>
              </div>

              <div className="mt-8">
                <div className="flex h-60 items-end justify-between gap-2 px-2">
                  {[
                    { h: "h-12", overlay: "bg-blue-600/40" },
                    { h: "h-24", overlay: "bg-blue-600/40" },
                    { h: "h-44", overlay: "bg-blue-600/60" },
                    { h: "h-60", overlay: "bg-blue-600" },
                    { h: "h-56", overlay: "bg-blue-600/80" },
                    { h: "h-32", overlay: "bg-blue-600/50" },
                    { h: "h-24", overlay: "bg-blue-600/40" },
                    { h: "h-16", overlay: "bg-blue-600/30" },
                  ].map((bar, index) => (
                    <div key={index} className={`relative flex-1 rounded-tl-2xl rounded-tr-2xl bg-slate-100 ${bar.h}`}>
                      <div className={`absolute left-0 top-0 h-full w-full rounded-tl-2xl rounded-tr-2xl ${bar.overlay}`} />
                      {index === 3 ? (
                        <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-bold leading-4 text-blue-600">
                          Peak
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-start justify-between px-2">
                  {["06:00", "09:00", "12:00", "15:00", "18:00", "21:00"].map((t) => (
                    <span
                      key={t}
                      className="text-[10px] font-bold uppercase leading-4 tracking-wide text-slate-400"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-3xl bg-white p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline outline-1 outline-offset-[-1px] outline-slate-200">
              <div className="flex items-center justify-between pb-6">
                <h2 className="text-lg font-bold leading-7 text-slate-900">Trạng thái cổng ga</h2>
                <button type="button" className="text-sm font-semibold leading-5 text-blue-600">
                  Tất cả
                </button>
              </div>

              <div className="mb-6 grid grid-cols-3 gap-3 rounded-3xl bg-slate-50 p-4 outline outline-1 outline-offset-[-1px] outline-slate-100">
                <div className="rounded-2xl bg-white p-3 outline outline-1 outline-offset-[-1px] outline-slate-200">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Online</div>
                  <div className="mt-1 text-xl font-black text-slate-900">{deviceHealth.online}</div>
                </div>
                <div className="rounded-2xl bg-white p-3 outline outline-1 outline-offset-[-1px] outline-slate-200">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Offline</div>
                  <div className="mt-1 text-xl font-black text-slate-900">{deviceHealth.offline}</div>
                </div>
                <div className="rounded-2xl bg-white p-3 outline outline-1 outline-offset-[-1px] outline-slate-200">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Alerts</div>
                  <div className="mt-1 text-xl font-black text-slate-900">{deviceHealth.alert}</div>
                </div>
              </div>

              <div className="flex max-h-64 flex-col gap-4 overflow-hidden pr-2">
                {gateStatuses.map((gate) => (
                  <div
                    key={gate.gate}
                    className="flex items-center justify-between rounded-3xl bg-slate-50 p-3 outline outline-1 outline-offset-[-1px] outline-slate-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white outline outline-1 outline-offset-[-1px] outline-slate-200">
                        <span
                          className={`h-4 w-4 rounded ${gate.tone === "blue" ? "bg-blue-600" : "bg-slate-400"}`}
                          aria-hidden="true"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-bold leading-5 text-slate-900">{gate.gate}</p>
                        <p className="text-xs font-medium uppercase leading-4 text-slate-500">
                          {gate.mode}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          gate.status === "ONLINE" ? "bg-green-500" : "bg-slate-300"
                        }`}
                        aria-hidden="true"
                      />
                      <span
                        className={`text-xs font-bold leading-4 ${
                          gate.status === "ONLINE" ? "text-green-600" : "text-slate-400"
                        }`}
                      >
                        {gate.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="overflow-hidden rounded-3xl bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline outline-1 outline-offset-[-1px] outline-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-base font-bold leading-6 text-slate-800">Giao dịch gần đây</h2>
                <p className="text-xs font-medium leading-4 text-slate-500">Time window: {timeWindow}</p>
              </div>
              <button type="button" className="text-sm font-semibold leading-5 text-blue-600">
                Xem chi tiết
              </button>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[944px]">
                <div className="grid grid-cols-[128px_224px_224px_208px_160px] bg-slate-50">
                  <div className="px-6 py-3 text-[10px] font-bold uppercase tracking-wide text-slate-500">Thời gian</div>
                  <div className="px-6 py-3 text-[10px] font-bold uppercase tracking-wide text-slate-500">Ga</div>
                  <div className="px-6 py-3 text-[10px] font-bold uppercase tracking-wide text-slate-500">Thiết bị</div>
                  <div className="px-6 py-3 text-[10px] font-bold uppercase tracking-wide text-slate-500">Ticket ref</div>
                  <div className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-wide text-slate-500">Kết quả</div>
                </div>

                {filteredTxns.map((txn, index) => (
                  <div
                    key={`${txn.time}-${txn.ticketRef}-${index}`}
                    className={`grid grid-cols-[128px_224px_224px_208px_160px] ${index === 0 ? "" : "border-t border-slate-100"}`}
                  >
                    <div className="px-6 py-4 text-sm font-medium leading-5 text-slate-600">{txn.time}</div>
                    <div className="px-6 py-4 text-sm font-semibold leading-5 text-slate-900">{txn.station}</div>
                    <div className="px-6 py-4 text-sm font-medium leading-5 text-slate-700">{txn.device}</div>
                    <div className="px-6 py-4 font-mono text-sm leading-5 text-blue-600">{txn.ticketRef}</div>
                    <div className="px-6 py-4 text-right">
                      <span
                        className={`inline-flex rounded-xl px-2 py-0.5 text-[10px] font-bold uppercase ${
                          txn.result === "ACCEPTED" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}
                      >
                        {txn.result}
                      </span>
                      {txn.reason ? (
                        <div className="mt-1 text-xs font-medium leading-4 text-slate-500">{txn.reason}</div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-3xl bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline outline-1 outline-offset-[-1px] outline-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-2">
                <span className="h-5 w-5 rounded bg-red-500" aria-hidden="true" />
                <h2 className="text-base font-bold leading-6 text-slate-800">
                  Sự cố gần đây (Recent Incidents)
                </h2>
              </div>
              <button type="button" className="text-sm font-semibold leading-5 text-slate-500">
                Xem lịch sử
              </button>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[944px]">
                <div className="grid grid-cols-[128px_224px_288px_176px_160px] bg-slate-50">
                  <div className="px-6 py-3 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    Thời gian
                  </div>
                  <div className="px-6 py-3 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    Vị trí
                  </div>
                  <div className="px-6 py-3 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    Loại sự cố
                  </div>
                  <div className="px-6 py-3 text-center text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    Mức độ
                  </div>
                  <div className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    Trạng thái
                  </div>
                </div>

                {incidents.map((incident, index) => (
                  <div
                    key={incident.time + incident.location}
                    className={`grid grid-cols-[128px_224px_288px_176px_160px] ${
                      index === 0 ? "" : "border-t border-slate-100"
                    }`}
                  >
                    <div className="px-6 py-4 text-sm font-medium leading-5 text-slate-600">
                      {incident.time}
                    </div>
                    <div className="px-6 py-4 text-sm font-semibold leading-5 text-slate-900">
                      {incident.location}
                    </div>
                    <div className="px-6 py-4 text-sm font-normal leading-5 text-slate-900">
                      {incident.type}
                    </div>
                    <div className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex rounded-xl px-2 py-0.5 text-[10px] font-bold uppercase ${
                          tonePills.severity[incident.severity.tone]
                        }`}
                      >
                        {incident.severity.label}
                      </span>
                    </div>
                    <div className="px-6 py-4 text-right">
                      <span
                        className={`inline-flex rounded-xl px-2 py-0.5 text-[10px] font-bold uppercase ${
                          tonePills.state[incident.state.tone]
                        }`}
                      >
                        {incident.state.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </StaffPortalShell>
    </>
  );
}
