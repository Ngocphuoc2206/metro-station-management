import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import PassengerShell from "@components/templates/PassengerShell";
import { liveApi, liveErrorMessage } from "@features/live/liveApi";
import type { LiveStationStatusDto, LiveTrainDto } from "@features/live/liveTypes";
import { publicApi } from "@features/public/publicApi";
import type { RouteDto, StationDto } from "@features/public/publicTypes";
import {
  Activity,
  Bell,
  ChevronRight,
  Circle,
  Clock3,
  MapPinned,
  Navigation,
  Radio,
  Route,
  TrainFront,
  TriangleAlert,
  Wifi,
  Wrench,
} from "lucide-react";

type TrainStatus = "on-time" | "delayed" | "arriving";

type Station = {
  id: string;
  name: string;
  x: number;
  y: number;
  status: "normal" | "busy" | "maintenance";
};

type Train = {
  id: string;
  code: string;
  direction: string;
  nextStation: string;
  eta: string;
  occupancy: number;
  status: TrainStatus;
  x: number;
  y: number;
};

const stations: Station[] = [
  { id: "ben-thanh", name: "Bến Thành", x: 90, y: 360, status: "busy" },
  { id: "opera", name: "Nhà hát TP", x: 170, y: 315, status: "normal" },
  { id: "ba-son", name: "Ba Son", x: 260, y: 278, status: "maintenance" },
  { id: "van-thanh", name: "Văn Thánh", x: 360, y: 242, status: "normal" },
  { id: "tan-cang", name: "Tân Cảng", x: 470, y: 225, status: "busy" },
  { id: "thao-dien", name: "Thảo Điền", x: 590, y: 196, status: "normal" },
  { id: "an-phu", name: "An Phú", x: 705, y: 165, status: "normal" },
  { id: "rach-chiec", name: "Rạch Chiếc", x: 815, y: 132, status: "normal" },
  { id: "suoi-tien", name: "Suối Tiên", x: 925, y: 104, status: "normal" },
];

const trains: Train[] = [
  {
    id: "train-01",
    code: "T01-08",
    direction: "Bến Thành → Suối Tiên",
    nextStation: "Văn Thánh",
    eta: "2 phút",
    occupancy: 68,
    status: "arriving",
    x: 330,
    y: 252,
  },
  {
    id: "train-02",
    code: "T01-11",
    direction: "Suối Tiên → Bến Thành",
    nextStation: "Thảo Điền",
    eta: "5 phút",
    occupancy: 42,
    status: "on-time",
    x: 630,
    y: 186,
  },
  {
    id: "train-03",
    code: "T01-14",
    direction: "Bến Thành → Suối Tiên",
    nextStation: "Rạch Chiếc",
    eta: "8 phút",
    occupancy: 81,
    status: "delayed",
    x: 770,
    y: 146,
  },
];

const statusLabel: Record<TrainStatus, string> = {
  "on-time": "Đúng giờ",
  delayed: "Trễ 4 phút",
  arriving: "Sắp đến ga",
};

const statusClass: Record<TrainStatus, string> = {
  "on-time": "bg-emerald-100 text-emerald-700",
  delayed: "bg-red-100 text-red-700",
  arriving: "bg-blue-100 text-blue-700",
};

const stationDotClass: Record<Station["status"], string> = {
  normal: "fill-white stroke-blue-600",
  busy: "fill-amber-100 stroke-amber-500",
  maintenance: "fill-red-100 stroke-red-500",
};

const emptyTrain: Train = {
  id: "",
  code: "--",
  direction: "--",
  nextStation: "--",
  eta: "--",
  occupancy: 0,
  status: "on-time",
  x: 0,
  y: 0,
};

const emptyStation: Station = {
  id: "",
  name: "--",
  x: 0,
  y: 0,
  status: "normal",
};

const mapTrainStatus = (value: string): TrainStatus => {
  const status = value.toUpperCase();
  if (status.includes("DELAY")) return "delayed";
  if (status.includes("ARRIV")) return "arriving";
  return "on-time";
};

const mapStationStatus = (value: string): Station["status"] => {
  const status = value.toUpperCase();
  if (status.includes("MAINTENANCE") || status.includes("CLOSED")) {
    return "maintenance";
  }
  if (status.includes("BUSY") || status.includes("CROWDED")) return "busy";
  return "normal";
};

export default function PassengerLiveMapPage() {
  const [routes, setRoutes] = useState<RouteDto[]>([]);
  const [stationsApi, setStationsApi] = useState<StationDto[]>([]);
  const [stationStatuses, setStationStatuses] = useState<LiveStationStatusDto[]>([]);
  const [trainLocations, setTrainLocations] = useState<LiveTrainDto[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [selectedTrainId, setSelectedTrainId] = useState("");
  const [selectedStationId, setSelectedStationId] = useState("");
  const [isLoadingLive, setIsLoadingLive] = useState(true);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [r, s] = await Promise.all([
          publicApi.getRoutes(),
          publicApi.getStations(),
        ]);
        if (cancelled) return;
        setRoutes(r);
        setStationsApi(s);
      } catch {
        // Live data can still be rendered without route and station labels.
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadLive = async () => {
      setIsLoadingLive(true);
      setLiveError(null);
      try {
        const [liveTrains, liveStations] = await Promise.all([
          liveApi.getTrains(selectedRouteId || undefined),
          liveApi.getStationStatuses(),
        ]);
        if (cancelled) return;
        setTrainLocations(liveTrains);
        setStationStatuses(liveStations);
        setSelectedTrainId((current) =>
          liveTrains.some((train) => train.id === current)
            ? current
            : (liveTrains[0]?.id ?? ""),
        );
        setSelectedStationId((current) =>
          liveStations.some((station) => station.id === current)
            ? current
            : (liveStations[0]?.id ?? ""),
        );
        setLastUpdatedAt(new Date());
      } catch (err) {
        if (!cancelled) setLiveError(liveErrorMessage(err));
      } finally {
        if (!cancelled) setIsLoadingLive(false);
      }
    };

    loadLive();
    const intervalId = window.setInterval(loadLive, 30_000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [selectedRouteId]);

  const displayStations = useMemo<Station[]>(
    () =>
      stationStatuses.map((station, index) => {
        const fallback = stations[index] ?? {
          x: 90 + index * 95,
          y: Math.max(70, 360 - index * 31),
        };
        return {
          id: station.id,
          name:
            stationsApi.find((catalogStation) => catalogStation.id === station.id)?.name ??
            station.name,
          x: station.x ?? fallback.x,
          y: station.y ?? fallback.y,
          status: mapStationStatus(station.status),
        };
      }),
    [stationStatuses, stationsApi],
  );

  const displayTrains = useMemo<Train[]>(
    () =>
      trainLocations.map((train, index) => {
        const stationIndex = displayStations.findIndex(
          (station) => station.id === train.nextStationId,
        );
        const trainLayout = trains[index];
        const fallback =
          displayStations[stationIndex] ??
          (trainLayout
            ? { x: trainLayout.x, y: trainLayout.y }
            : undefined) ??
          stations[index] ?? {
            x: 90 + index * 95,
            y: Math.max(70, 360 - index * 31),
          };
        return {
          id: train.id,
          code: train.code,
          direction: train.direction || "--",
          nextStation: train.nextStationName || train.nextStationId || "--",
          eta: train.eta || "--",
          occupancy: Math.min(100, Math.max(0, train.occupancy)),
          status: mapTrainStatus(train.status),
          x: train.x ?? fallback.x + 24,
          y: train.y ?? fallback.y - 12,
        };
      }),
    [displayStations, trainLocations],
  );

  const selectedTrain = useMemo(
    () =>
      displayTrains.find((train) => train.id === selectedTrainId) ??
      displayTrains[0] ??
      emptyTrain,
    [displayTrains, selectedTrainId],
  );

  const selectedStation = useMemo(
    () =>
      displayStations.find((station) => station.id === selectedStationId) ??
      displayStations[0] ??
      emptyStation,
    [displayStations, selectedStationId],
  );

  const resolvedRouteName = useMemo(() => {
    const r = routes.find((x) => x.id === selectedRouteId);
    return r?.name ?? (selectedRouteId ? `Tuyến ${selectedRouteId}` : "Tất cả tuyến");
  }, [routes, selectedRouteId]);

  const availableRoutes = useMemo(() => {
    const routesById = new Map(routes.map((route) => [route.id, route]));
    trainLocations.forEach((train) => {
      if (train.routeId && !routesById.has(train.routeId)) {
        routesById.set(train.routeId, {
          id: train.routeId,
          name: `Tuyến ${train.routeId}`,
        });
      }
    });
    return Array.from(routesById.values());
  }, [routes, trainLocations]);

  const displayLinePath = displayStations.length > 1
    ? displayStations.map((station) => `${station.x},${station.y}`).join(" ")
    : "";
  const activeStations = displayStations.filter(
    (station) => station.status !== "maintenance",
  ).length;
  const onTimeTrains = displayTrains.filter(
    (train) => train.status === "on-time",
  ).length;
  const delayedTrains = displayTrains.filter(
    (train) => train.status === "delayed",
  ).length;
  const onTimePercentage = displayTrains.length
    ? Math.round((onTimeTrains / displayTrains.length) * 100)
    : 0;

  return (
    <>
      <Head>
        <title>Bản đồ live | MetroNext</title>
      </Head>

      <PassengerShell>
        <div className="mx-auto w-full max-w-360 space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-500">
                <span>Hành khách</span>
                <ChevronRight className="h-3.5 w-3.5" />
                <span className="text-slate-900">Bản đồ live</span>
              </div>
              <h1 className="text-4xl font-black leading-10 text-slate-900">
                Bản đồ metro trực tuyến
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">
                <Wifi className="h-4 w-4" />
                Live
              </span>
              <span className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200">
                <Clock3 className="h-4 w-4 text-blue-600" />
                {lastUpdatedAt
                  ? `Cập nhật ${lastUpdatedAt.toLocaleTimeString("vi-VN")}`
                  : "Chưa cập nhật"}
              </span>
            </div>
          </div>

          {liveError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {liveError}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-4">
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Tàu đang chạy
              </p>
              <p className="mt-2 text-3xl font-black text-slate-900">
                {isLoadingLive ? "--" : displayTrains.length}
              </p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Ga hoạt động
              </p>
              <p className="mt-2 text-3xl font-black text-emerald-600">
                {isLoadingLive ? "--" : `${activeStations}/${displayStations.length}`}
              </p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Chuyến đúng giờ
              </p>
              <p className="mt-2 text-3xl font-black text-blue-600">
                {isLoadingLive ? "--" : `${onTimePercentage}%`}
              </p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Cảnh báo
              </p>
              <p className="mt-2 text-3xl font-black text-amber-600">
                {isLoadingLive ? "--" : delayedTrains}
              </p>
            </article>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-600">
                    <MapPinned className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      {resolvedRouteName}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Theo dõi vị trí tàu, trạng thái ga và mật độ hành khách.
                    </p>
                  </div>
                </div>

                <div className="relative w-full max-w-xs">
                  <Route className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <select
                    value={selectedRouteId}
                    onChange={(event) => setSelectedRouteId(event.target.value)}
                    className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 outline-none"
                  >
                    <option value="">Tất cả tuyến</option>
                    {availableRoutes.map((route) => (
                      <option key={route.id} value={route.id}>
                        {route.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="relative min-h-140 overflow-hidden bg-slate-950">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.10)_1px,transparent_1px)] bg-[size:48px_48px]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(59,130,246,0.22),transparent_30%),radial-gradient(circle_at_78%_28%,rgba(16,185,129,0.18),transparent_28%)]" />

                <svg
                  className="relative z-10 h-140 w-full min-w-190"
                  viewBox="0 0 1020 460"
                  role="img"
                  aria-label="Bản đồ live tuyến metro số 1"
                >
                  {displayLinePath ? (
                    <>
                      <polyline
                        points={displayLinePath}
                        fill="none"
                        stroke="rgba(96,165,250,0.22)"
                        strokeWidth="32"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <polyline
                        points={displayLinePath}
                        fill="none"
                        stroke="#60A5FA"
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <polyline
                        points={displayLinePath}
                        fill="none"
                        stroke="#DBEAFE"
                        strokeWidth="3"
                        strokeDasharray="10 16"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </>
                  ) : null}

                  {displayStations.map((station) => (
                    <g
                      key={station.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedStationId(station.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedStationId(station.id);
                        }
                      }}
                      className="cursor-pointer"
                    >
                      <circle
                        cx={station.x}
                        cy={station.y}
                        r={selectedStation.id === station.id ? 15 : 12}
                        className={stationDotClass[station.status]}
                        strokeWidth="4"
                      />
                      <text
                        x={station.x}
                        y={station.y + (station.y > 250 ? 36 : -24)}
                        textAnchor="middle"
                        className="fill-white text-[15px] font-bold"
                      >
                        {station.name}
                      </text>
                    </g>
                  ))}

                  {displayTrains.map((train) => {
                    const isSelected = train.id === selectedTrain.id;
                    return (
                      <g
                        key={train.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedTrainId(train.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setSelectedTrainId(train.id);
                          }
                        }}
                        className="cursor-pointer"
                      >
                        <circle
                          cx={train.x}
                          cy={train.y}
                          r={isSelected ? 26 : 22}
                          fill={
                            train.status === "delayed"
                              ? "#EF4444"
                              : train.status === "arriving"
                                ? "#3B82F6"
                                : "#10B981"
                          }
                          opacity="0.18"
                        />
                        <circle
                          cx={train.x}
                          cy={train.y}
                          r={isSelected ? 16 : 13}
                          fill={
                            train.status === "delayed"
                              ? "#EF4444"
                              : train.status === "arriving"
                                ? "#3B82F6"
                                : "#10B981"
                          }
                          stroke="white"
                          strokeWidth="4"
                        />
                        <text
                          x={train.x}
                          y={train.y + 5}
                          textAnchor="middle"
                          className="fill-white text-[13px] font-black"
                        >
                          M
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {!isLoadingLive && !liveError && displayStations.length === 0 && displayTrains.length === 0 ? (
                  <div className="absolute inset-0 z-20 flex items-center justify-center p-6">
                    <div className="rounded-2xl border border-slate-700 bg-slate-900/90 px-6 py-5 text-center text-sm text-slate-300 shadow-xl">
                      <Radio className="mx-auto mb-2 h-6 w-6 text-blue-400" />
                      Chưa có dữ liệu tàu hoặc ga trực tuyến từ hệ thống vận hành.
                    </div>
                  </div>
                ) : null}

                <div className="absolute bottom-5 left-5 z-20 flex flex-wrap gap-2 rounded-2xl bg-white/95 p-3 text-xs font-semibold text-slate-600 shadow-lg backdrop-blur">
                  <span className="inline-flex items-center gap-1.5">
                    <Circle className="h-3 w-3 fill-blue-600 text-blue-600" />
                    Bình thường
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Circle className="h-3 w-3 fill-amber-500 text-amber-500" />
                    Đông khách
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Circle className="h-3 w-3 fill-red-500 text-red-500" />
                    Bảo trì
                  </span>
                </div>
              </div>
            </section>

            <aside className="space-y-6">
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Tàu được chọn
                    </p>
                    <h2 className="text-xl font-black text-slate-900">
                      {selectedTrain.code}
                    </h2>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass[selectedTrain.status]}`}
                  >
                    {statusLabel[selectedTrain.status]}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Hướng đi
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {selectedTrain.direction}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Ga kế tiếp
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-900">
                        {selectedTrain.nextStation}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        ETA
                      </p>
                      <p className="mt-1 text-sm font-bold text-blue-600">
                        {selectedTrain.eta}
                      </p>
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-slate-500">
                      <span>Mật độ toa</span>
                      <span>{selectedTrain.occupancy}%</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${
                          selectedTrain.occupancy > 75
                            ? "bg-amber-500"
                            : "bg-blue-600"
                        }`}
                        style={{ width: `${selectedTrain.occupancy}%` }}
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <Radio className="h-5 w-5 text-blue-600" />
                  <h2 className="text-lg font-bold text-slate-900">
                    Danh sách tàu
                  </h2>
                </div>

                <div className="space-y-3">
                  {displayTrains.map((train) => (
                    <button
                      key={train.id}
                      type="button"
                      onClick={() => setSelectedTrainId(train.id)}
                      className={`flex w-full items-center justify-between rounded-2xl border p-3 text-left transition ${
                        selectedTrain.id === train.id
                          ? "border-blue-200 bg-blue-50"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                          <TrainFront className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="text-sm font-black text-slate-900">
                            {train.code}
                          </p>
                          <p className="text-xs text-slate-500">
                            {train.nextStation} · {train.eta}
                          </p>
                        </div>
                      </div>
                      <Navigation className="h-4 w-4 text-slate-400" />
                    </button>
                  ))}
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <Route className="h-5 w-5 text-blue-600" />
                  <h2 className="text-lg font-bold text-slate-900">
                    Ga được chọn
                  </h2>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm font-black text-slate-900">
                    {selectedStation.name}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Trạng thái vận hành:{" "}
                    {selectedStation.status === "maintenance"
                      ? "Bảo trì"
                      : selectedStation.status === "busy"
                        ? "Đông khách"
                        : "Bình thường"}
                  </p>
                </div>
              </section>
            </aside>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <Activity className="h-5 w-5" />
              </div>
              <h3 className="text-base font-black text-slate-900">
                Trạng thái vận hành
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {activeStations}/{displayStations.length} ga đang hoạt động,{" "}
                {displayTrains.length} đoàn tàu đang được theo dõi.
              </p>
            </article>
            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <Bell className="h-5 w-5" />
              </div>
              <h3 className="text-base font-black text-slate-900">
                Ga đang được chọn
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {selectedStation.name}:{" "}
                {selectedStation.status === "busy"
                  ? "đang đông khách."
                  : selectedStation.status === "maintenance"
                    ? "đang bảo trì."
                    : "đang vận hành bình thường."}
              </p>
            </article>
            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-red-100 text-red-700">
                <Wrench className="h-5 w-5" />
              </div>
              <h3 className="text-base font-black text-slate-900">
                Cảnh báo trễ chuyến
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {delayedTrains > 0
                  ? `${delayedTrains} đoàn tàu đang báo trễ.`
                  : "Không có đoàn tàu báo trễ ở thời điểm hiện tại."}
              </p>
            </article>
          </div>

          <div className="rounded-3xl border border-blue-100 bg-blue-50 p-4">
            <div className="flex gap-3">
              <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
              <p className="text-sm leading-6 text-slate-700">
                Dữ liệu được cập nhật từ API trạng thái tàu và ga trực tuyến.
                Chọn tuyến để lọc các đoàn tàu đang hiển thị trên bản đồ.
              </p>
            </div>
          </div>
        </div>
      </PassengerShell>
    </>
  );
}
