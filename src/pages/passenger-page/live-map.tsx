import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import PassengerShell from "@components/templates/PassengerShell";
import { liveApi, liveErrorMessage } from "@features/live/liveApi";
import type { LiveStationStatusDto, LiveTrainDto } from "@features/live/liveTypes";
import { publicApi } from "@features/public/publicApi";
import type { RouteDto, StationDto } from "@features/public/publicTypes";
import { scheduleApi, scheduleErrorMessage } from "@features/schedule/scheduleApi";
import type { ScheduleDto } from "@features/schedule/scheduleTypes";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bell,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock3,
  Gauge,
  MapPinned,
  Navigation,
  Radio,
  Route,
  Search,
  Signal,
  TrainFront,
  UsersRound,
  Wifi,
  Wrench,
} from "lucide-react";

type TrainStatus = "on-time" | "delayed" | "arriving";
type StationStatus = "normal" | "busy" | "maintenance";

type Station = {
  id: string;
  name: string;
  x: number;
  y: number;
  status: StationStatus;
  congestionLevel: number;
  message?: string;
  updatedAt?: string;
};

type Train = {
  id: string;
  code: string;
  direction: string;
  nextStationId?: string;
  nextStation: string;
  eta: string;
  occupancy: number;
  status: TrainStatus;
  x: number;
  y: number;
  routeId?: string;
};

type ScheduleStop = ScheduleDto & {
  stationName: string;
  routeName: string;
  minutesUntil: number | null;
  source: "live" | "schedule";
  trainCode?: string;
  etaText?: string;
};

const fallbackStations: Station[] = [
  { id: "ben-thanh", name: "Bến Thành", x: 82, y: 355, status: "busy", congestionLevel: 78 },
  { id: "opera", name: "Nhà hát TP", x: 172, y: 316, status: "normal", congestionLevel: 42 },
  { id: "ba-son", name: "Ba Son", x: 270, y: 280, status: "normal", congestionLevel: 36 },
  { id: "van-thanh", name: "Văn Thánh", x: 382, y: 244, status: "normal", congestionLevel: 48 },
  { id: "tan-cang", name: "Tân Cảng", x: 500, y: 220, status: "busy", congestionLevel: 72 },
  { id: "thao-dien", name: "Thảo Điền", x: 622, y: 190, status: "normal", congestionLevel: 40 },
  { id: "an-phu", name: "An Phú", x: 740, y: 160, status: "normal", congestionLevel: 31 },
  { id: "rach-chiec", name: "Rạch Chiếc", x: 850, y: 128, status: "normal", congestionLevel: 34 },
  { id: "suoi-tien", name: "Suối Tiên", x: 950, y: 100, status: "normal", congestionLevel: 45 },
];

const fallbackTrains: Train[] = [
  {
    id: "train-01",
    code: "T01-08",
    direction: "Bến Thành → Suối Tiên",
    nextStationId: "van-thanh",
    nextStation: "Văn Thánh",
    eta: "2 phút",
    occupancy: 68,
    status: "arriving",
    x: 350,
    y: 248,
  },
  {
    id: "train-02",
    code: "T01-11",
    direction: "Suối Tiên → Bến Thành",
    nextStationId: "thao-dien",
    nextStation: "Thảo Điền",
    eta: "5 phút",
    occupancy: 42,
    status: "on-time",
    x: 650,
    y: 185,
  },
  {
    id: "train-03",
    code: "T01-14",
    direction: "Bến Thành → Suối Tiên",
    nextStationId: "rach-chiec",
    nextStation: "Rạch Chiếc",
    eta: "8 phút",
    occupancy: 82,
    status: "delayed",
    x: 800,
    y: 140,
  },
];

const statusLabel: Record<TrainStatus, string> = {
  "on-time": "Đúng giờ",
  delayed: "Trễ chuyến",
  arriving: "Sắp đến ga",
};

const statusClass: Record<TrainStatus, string> = {
  "on-time": "bg-emerald-50 text-emerald-700 ring-emerald-200",
  delayed: "bg-rose-50 text-rose-700 ring-rose-200",
  arriving: "bg-sky-50 text-sky-700 ring-sky-200",
};

const trainFill: Record<TrainStatus, string> = {
  "on-time": "#10B981",
  delayed: "#F43F5E",
  arriving: "#0EA5E9",
};

const stationDotClass: Record<StationStatus, string> = {
  normal: "fill-white stroke-sky-500",
  busy: "fill-amber-100 stroke-amber-500",
  maintenance: "fill-rose-100 stroke-rose-500",
};

const stationStatusLabel: Record<StationStatus, string> = {
  normal: "Vận hành ổn định",
  busy: "Đông khách",
  maintenance: "Bảo trì",
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
  congestionLevel: 0,
};

const mapTrainStatus = (value: string): TrainStatus => {
  const status = value.toUpperCase();
  if (status.includes("DELAY") || status.includes("LATE") || status.includes("TRỄ")) {
    return "delayed";
  }
  if (status.includes("ARRIV") || status.includes("APPROACH") || status.includes("ĐẾN")) {
    return "arriving";
  }
  return "on-time";
};

const mapStationStatus = (value: string, congestionLevel = 0): StationStatus => {
  const status = value.toUpperCase();
  if (status.includes("MAINTENANCE") || status.includes("CLOSED") || status.includes("BẢO")) {
    return "maintenance";
  }
  if (
    status.includes("BUSY") ||
    status.includes("CROWDED") ||
    status.includes("ĐÔNG") ||
    congestionLevel >= 70
  ) {
    return "busy";
  }
  return "normal";
};

const getStationId = (station: LiveStationStatusDto) => station.stationId || station.id;

const minutesUntil = (time: string) => {
  if (!time) return null;
  const match = time.match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;

  const now = new Date();
  const target = new Date(now);
  target.setHours(Number(match[1]), Number(match[2]), 0, 0);
  if (target.getTime() < now.getTime()) target.setDate(target.getDate() + 1);

  return Math.round((target.getTime() - now.getTime()) / 60_000);
};

const etaMinutes = (eta: string) => {
  const match = eta.match(/(\d+)/);
  return match ? Number(match[1]) : null;
};

const formatClock = (value: string) => {
  const match = value?.match(/(\d{1,2}):(\d{2})/);
  return match ? `${match[1].padStart(2, "0")}:${match[2]}` : value || "--:--";
};

const getScheduleStatus = (status: string) => {
  const value = status.toUpperCase();
  if (value.includes("DELAY") || value.includes("TRỄ")) return "Trễ";
  if (value.includes("CANCEL") || value.includes("HUỶ") || value.includes("HỦY")) return "Huỷ";
  if (value.includes("ACTIVE") || value.includes("ON")) return "Đang chạy";
  return status || "Theo lịch";
};

export default function PassengerLiveMapPage() {
  const [routes, setRoutes] = useState<RouteDto[]>([]);
  const [stationsApi, setStationsApi] = useState<StationDto[]>([]);
  const [schedules, setSchedules] = useState<ScheduleDto[]>([]);
  const [stationStatuses, setStationStatuses] = useState<LiveStationStatusDto[]>([]);
  const [trainLocations, setTrainLocations] = useState<LiveTrainDto[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [selectedTrainId, setSelectedTrainId] = useState("");
  const [selectedStationId, setSelectedStationId] = useState("");
  const [isStationSchedulePinned, setIsStationSchedulePinned] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoadingLive, setIsLoadingLive] = useState(true);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(true);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadCatalog = async () => {
      try {
        const [routeResult, stationResult] = await Promise.all([
          publicApi.getRoutes(),
          publicApi.getStations(),
        ]);
        if (cancelled) return;
        setRoutes(routeResult);
        setStationsApi(stationResult);
      } catch {
        if (!cancelled) {
          setRoutes([]);
          setStationsApi([]);
        }
      }
    };

    loadCatalog();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadSchedule = async () => {
      setIsLoadingSchedule(true);
      setScheduleError(null);
      try {
        const result = selectedRouteId
          ? await scheduleApi.listByRoute(selectedRouteId)
          : await scheduleApi.list();
        if (!cancelled) setSchedules(result);
      } catch (err) {
        if (!cancelled) {
          setSchedules([]);
          setScheduleError(scheduleErrorMessage(err));
        }
      } finally {
        if (!cancelled) setIsLoadingSchedule(false);
      }
    };

    loadSchedule();
    return () => {
      cancelled = true;
    };
  }, [selectedRouteId]);

  useEffect(() => {
    setIsStationSchedulePinned(false);
  }, [selectedRouteId]);

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
          liveStations.some((station) => getStationId(station) === current)
            ? current
            : (liveStations[0] ? getStationId(liveStations[0]) : ""),
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

  const stationNameById = useMemo(
    () => new Map(stationsApi.map((station) => [station.id, station.name])),
    [stationsApi],
  );

  const routeNameById = useMemo(
    () => new Map(routes.map((route) => [route.id, route.name])),
    [routes],
  );

  const allDisplayStations = useMemo<Station[]>(
    () =>
      stationStatuses.length > 0
        ? stationStatuses.map((station, index) => {
            const stationId = getStationId(station);
            const fallback = fallbackStations[index] ?? {
              x: 82 + index * 96,
              y: Math.max(80, 355 - index * 30),
            };
            const congestionLevel = Math.min(
              100,
              Math.max(0, station.congestionLevel ?? fallbackStations[index]?.congestionLevel ?? 0),
            );

            return {
              id: stationId,
              name: stationNameById.get(stationId) ?? station.name,
              x: station.x ?? fallback.x,
              y: station.y ?? fallback.y,
              status: mapStationStatus(station.status, congestionLevel),
              congestionLevel,
              message: station.message,
              updatedAt: station.updatedAt,
            };
          })
        : fallbackStations,
    [stationNameById, stationStatuses],
  );

  const displayTrains = useMemo<Train[]>(() => {
    const mapped =
      trainLocations.length > 0
        ? trainLocations.map((train, index) => {
            const stationIndex = allDisplayStations.findIndex(
              (station) => station.id === train.nextStationId,
            );
            const fallback =
              allDisplayStations[stationIndex] ??
              fallbackTrains[index] ??
              fallbackStations[index] ?? {
                x: 82 + index * 96,
                y: Math.max(80, 355 - index * 30),
              };
            return {
              id: train.id,
              code: train.code,
              direction: train.direction || "--",
              nextStationId: train.nextStationId,
              nextStation: train.nextStationName || train.nextStationId || "--",
              eta: train.eta || "--",
              occupancy: Math.min(100, Math.max(0, train.occupancy)),
              status: mapTrainStatus(train.status),
              x: train.x ?? fallback.x + 26,
              y: train.y ?? fallback.y - 16,
              routeId: train.routeId,
            };
          })
        : fallbackTrains;

    return mapped.filter((train) => {
      const normalizedSearch = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !normalizedSearch ||
        train.code.toLowerCase().includes(normalizedSearch) ||
        train.nextStation.toLowerCase().includes(normalizedSearch);
      const matchesRoute = !selectedRouteId || train.routeId === selectedRouteId || !train.routeId;
      return matchesSearch && matchesRoute;
    });
  }, [allDisplayStations, searchTerm, selectedRouteId, trainLocations]);

  const selectedTrain = useMemo(
    () =>
      displayTrains.find((train) => train.id === selectedTrainId) ??
      displayTrains[0] ??
      emptyTrain,
    [displayTrains, selectedTrainId],
  );

  const selectedStation = useMemo(
    () =>
      allDisplayStations.find((station) => station.id === selectedStationId) ??
      allDisplayStations[0] ??
      emptyStation,
    [allDisplayStations, selectedStationId],
  );

  const selectStation = (stationId: string) => {
    setSelectedStationId(stationId);
    setIsStationSchedulePinned(true);
  };

  const availableRoutes = useMemo(() => {
    const routesById = new Map(routes.map((route) => [route.id, route]));
    trainLocations.forEach((train) => {
      if (train.routeId && !routesById.has(train.routeId)) {
        routesById.set(train.routeId, { id: train.routeId, name: `Tuyến ${train.routeId}` });
      }
    });
    schedules.forEach((schedule) => {
      if (schedule.routeId && !routesById.has(schedule.routeId)) {
        routesById.set(schedule.routeId, { id: schedule.routeId, name: `Tuyến ${schedule.routeId}` });
      }
    });
    return Array.from(routesById.values());
  }, [routes, schedules, trainLocations]);

  const resolvedRouteName = useMemo(() => {
    const route = routes.find((item) => item.id === selectedRouteId);
    return route?.name ?? (selectedRouteId ? `Tuyến ${selectedRouteId}` : "Tất cả tuyến");
  }, [routes, selectedRouteId]);

  const upcomingSchedules = useMemo<ScheduleStop[]>(() => {
    const routeFiltered = schedules.filter(
      (schedule) => !selectedRouteId || schedule.routeId === selectedRouteId,
    );
    const stationFiltered = isStationSchedulePinned && selectedStation.id
      ? routeFiltered.filter((schedule) => schedule.stationId === selectedStation.id)
      : routeFiltered;

    const scheduleStops = stationFiltered
      .map((schedule) => ({
        ...schedule,
        stationName: stationNameById.get(schedule.stationId) ?? schedule.stationId,
        routeName: routeNameById.get(schedule.routeId) ?? `Tuyến ${schedule.routeId}`,
        minutesUntil: minutesUntil(schedule.departureTime || schedule.arrivalTime),
        source: "schedule" as const,
      }))
      .filter((schedule) => schedule.minutesUntil === null || schedule.minutesUntil >= 0);

    const liveStops = (trainLocations.length > 0 ? displayTrains : [])
      .filter((train) => !isStationSchedulePinned || train.nextStationId === selectedStation.id)
      .map((train) => ({
        id: `live-${train.id}`,
        routeId: train.routeId ?? selectedRouteId,
        stationId: train.nextStationId ?? "",
        direction: train.direction,
        departureTime: "",
        arrivalTime: "",
        frequencyMinutes: 0,
        status: statusLabel[train.status],
        stationName: train.nextStation,
        routeName: train.routeId
          ? routeNameById.get(train.routeId) ?? `Tuyến ${train.routeId}`
          : resolvedRouteName,
        minutesUntil: etaMinutes(train.eta),
        source: "live" as const,
        trainCode: train.code,
        etaText: train.eta,
      }));

    return [...liveStops, ...scheduleStops]
      .sort((a, b) => (a.minutesUntil ?? 9_999) - (b.minutesUntil ?? 9_999))
      .slice(0, 8);
  }, [
    displayTrains,
    isStationSchedulePinned,
    resolvedRouteName,
    routeNameById,
    schedules,
    selectedRouteId,
    selectedStation.id,
    stationNameById,
    trainLocations.length,
  ]);

  const linePath = allDisplayStations.length > 1
    ? allDisplayStations.map((station) => `${station.x},${station.y}`).join(" ")
    : "";
  const activeStations = allDisplayStations.filter(
    (station) => station.status !== "maintenance",
  ).length;
  const delayedTrains = displayTrains.filter((train) => train.status === "delayed").length;
  const averageOccupancy = displayTrains.length
    ? Math.round(displayTrains.reduce((sum, train) => sum + train.occupancy, 0) / displayTrains.length)
    : 0;
  const nextSchedule = upcomingSchedules[0];
  const hasLiveData = stationStatuses.length > 0 || trainLocations.length > 0;

  return (
    <>
      <Head>
        <title>Bản đồ trực tuyến | MetroNext</title>
      </Head>

      <PassengerShell>
        <div className="mx-auto w-full max-w-360 space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-500">
                <span>Hành khách</span>
                <ChevronRight className="h-3.5 w-3.5" />
                <span className="text-slate-900">Bản đồ trực tuyến</span>
              </div>
              <h1 className="text-3xl font-black leading-tight text-slate-950 md:text-4xl">
                Theo dõi tàu đang chạy
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Xem vị trí tàu, mật độ ga và các chuyến sắp khởi hành theo thời gian thực.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">
                <Wifi className="h-4 w-4" />
                Live
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200">
                <Clock3 className="h-4 w-4 text-sky-600" />
                {lastUpdatedAt
                  ? `Cập nhật ${lastUpdatedAt.toLocaleTimeString("vi-VN")}`
                  : "Đang chờ dữ liệu"}
              </span>
            </div>
          </div>

          {liveError || scheduleError ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
              {liveError ?? scheduleError}
            </div>
          ) : null}

          <section className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: "Tàu đang chạy",
                  value: isLoadingLive ? "--" : displayTrains.length,
                  icon: TrainFront,
                  tone: "text-sky-700 bg-sky-50",
                },
                {
                  label: "Ga hoạt động",
                  value: isLoadingLive ? "--" : `${activeStations}/${allDisplayStations.length}`,
                  icon: CheckCircle2,
                  tone: "text-emerald-700 bg-emerald-50",
                },
                {
                  label: "Mật độ trung bình",
                  value: isLoadingLive ? "--" : `${averageOccupancy}%`,
                  icon: UsersRound,
                  tone: "text-violet-700 bg-violet-50",
                },
                {
                  label: "Cảnh báo trễ",
                  value: isLoadingLive ? "--" : delayedTrains,
                  icon: Bell,
                  tone: "text-rose-700 bg-rose-50",
                },
              ].map((card) => {
                const Icon = card.icon;
                return (
                  <article key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          {card.label}
                        </p>
                        <p className="mt-2 text-3xl font-black text-slate-950">
                          {card.value}
                        </p>
                      </div>
                      <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${card.tone}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>

            <article className="rounded-2xl border border-slate-200 bg-slate-950 p-4 text-white shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-300">
                <Signal className="h-4 w-4 text-emerald-300" />
                Chuyến gần nhất
              </div>
              <p className="mt-3 text-2xl font-black">
                {nextSchedule
                  ? nextSchedule.source === "live"
                    ? (nextSchedule.etaText || `${nextSchedule.minutesUntil ?? "--"}'`)
                    : formatClock(nextSchedule.departureTime)
                  : "--:--"}
              </p>
              <p className="mt-1 text-sm text-slate-300">
                {nextSchedule
                  ? `${nextSchedule.stationName} · ${
                      nextSchedule.source === "live" && nextSchedule.trainCode
                        ? nextSchedule.trainCode
                        : nextSchedule.routeName
                    }`
                  : "Chưa có lịch trình phù hợp"}
              </p>
            </article>
          </section>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                    <MapPinned className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-lg font-black text-slate-950">{resolvedRouteName}</h2>
                    <p className="text-xs text-slate-500">
                      Chọn tàu hoặc ga để xem lịch trình và trạng thái chi tiết.
                    </p>
                  </div>
                </div>

                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                  <label className="relative min-w-56">
                    <Route className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <select
                      value={selectedRouteId}
                      onChange={(event) => setSelectedRouteId(event.target.value)}
                      className="h-11 w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
                    >
                      <option value="">Tất cả tuyến</option>
                      {availableRoutes.map((route) => (
                        <option key={route.id} value={route.id}>
                          {route.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="relative min-w-56">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Tìm ga hoặc mã tàu"
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
                    />
                  </label>
                </div>
              </div>

              <div className="relative min-h-150 overflow-x-auto overflow-y-hidden bg-slate-950">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.10)_1px,transparent_1px)] bg-[size:48px_48px]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(14,165,233,0.22),transparent_30%),radial-gradient(circle_at_82%_24%,rgba(16,185,129,0.18),transparent_28%),linear-gradient(135deg,rgba(15,23,42,0),rgba(15,23,42,0.72))]" />

                <svg
                  className="relative z-10 h-150 w-full min-w-240"
                  viewBox="0 0 1040 500"
                  role="img"
                  aria-label="Bản đồ trực tuyến tuyến metro"
                >
                  {linePath ? (
                    <>
                      <polyline
                        points={linePath}
                        fill="none"
                        stroke="rgba(14,165,233,0.20)"
                        strokeWidth="42"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <polyline
                        points={linePath}
                        fill="none"
                        stroke="#38BDF8"
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <polyline
                        points={linePath}
                        fill="none"
                        stroke="#ECFEFF"
                        strokeWidth="3"
                        strokeDasharray="12 16"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </>
                  ) : null}

                  {allDisplayStations.map((station) => {
                    const isSelected = selectedStation.id === station.id;
                    const isDimmed =
                      searchTerm.trim() &&
                      !station.name.toLowerCase().includes(searchTerm.trim().toLowerCase());

                    return (
                      <g
                        key={station.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => selectStation(station.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            selectStation(station.id);
                          }
                        }}
                        className="cursor-pointer"
                        opacity={isDimmed ? 0.36 : 1}
                      >
                        <circle
                          cx={station.x}
                          cy={station.y}
                          r={isSelected ? 22 : 16}
                          fill="rgba(255,255,255,0.12)"
                        />
                        <circle
                          cx={station.x}
                          cy={station.y}
                          r={isSelected ? 14 : 11}
                          className={stationDotClass[station.status]}
                          strokeWidth="4"
                        />
                        <text
                          x={station.x}
                          y={station.y + (station.y > 240 ? 36 : -25)}
                          textAnchor="middle"
                          className="fill-white text-[14px] font-bold"
                        >
                          {station.name}
                        </text>
                        {station.congestionLevel > 0 ? (
                          <text
                            x={station.x}
                            y={station.y + (station.y > 240 ? 53 : -41)}
                            textAnchor="middle"
                            className="fill-slate-300 text-[11px] font-semibold"
                          >
                            {station.congestionLevel}%
                          </text>
                        ) : null}
                      </g>
                    );
                  })}

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
                          r={isSelected ? 34 : 27}
                          fill={trainFill[train.status]}
                          opacity="0.18"
                        />
                        <circle
                          cx={train.x}
                          cy={train.y}
                          r={isSelected ? 19 : 15}
                          fill={trainFill[train.status]}
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
                        <rect
                          x={train.x - 38}
                          y={train.y - 56}
                          width="76"
                          height="25"
                          rx="12"
                          fill="rgba(15,23,42,0.88)"
                          stroke="rgba(255,255,255,0.16)"
                        />
                        <text
                          x={train.x}
                          y={train.y - 39}
                          textAnchor="middle"
                          className="fill-white text-[12px] font-black"
                        >
                          {train.code}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {!isLoadingLive && !liveError && !hasLiveData ? (
                  <div className="absolute inset-0 z-20 flex items-center justify-center p-6">
                    <div className="max-w-sm rounded-2xl border border-slate-700 bg-slate-900/92 px-6 py-5 text-center text-sm text-slate-300 shadow-xl backdrop-blur">
                      <Radio className="mx-auto mb-2 h-6 w-6 text-sky-300" />
                      Chưa có dữ liệu live từ hệ thống vận hành. Màn hình đang hiển thị sơ đồ tuyến mẫu.
                    </div>
                  </div>
                ) : null}

                <div className="absolute bottom-5 left-5 z-20 flex flex-wrap gap-2 rounded-2xl bg-white/95 p-3 text-xs font-semibold text-slate-600 shadow-lg backdrop-blur">
                  <span className="inline-flex items-center gap-1.5">
                    <Circle className="h-3 w-3 fill-sky-500 text-sky-500" />
                    Bình thường
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Circle className="h-3 w-3 fill-amber-500 text-amber-500" />
                    Đông khách
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Circle className="h-3 w-3 fill-rose-500 text-rose-500" />
                    Bảo trì
                  </span>
                </div>
              </div>
            </section>

            <aside className="space-y-6">
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Tàu được chọn
                    </p>
                    <h2 className="text-2xl font-black text-slate-950">{selectedTrain.code}</h2>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${statusClass[selectedTrain.status]}`}>
                    {statusLabel[selectedTrain.status]}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Hướng đi
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-950">{selectedTrain.direction}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Ga kế tiếp
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-950">{selectedTrain.nextStation}</p>
                    </div>
                    <div className="rounded-2xl bg-sky-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-sky-700">
                        ETA
                      </p>
                      <p className="mt-1 text-sm font-black text-sky-700">{selectedTrain.eta}</p>
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
                          selectedTrain.occupancy >= 75
                            ? "bg-amber-500"
                            : selectedTrain.occupancy >= 50
                              ? "bg-sky-500"
                              : "bg-emerald-500"
                        }`}
                        style={{ width: `${selectedTrain.occupancy}%` }}
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <MapPinned className="h-5 w-5 text-sky-600" />
                  <h2 className="text-lg font-black text-slate-950">Ga được chọn</h2>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-black text-slate-950">{selectedStation.name}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {stationStatusLabel[selectedStation.status]}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700 ring-1 ring-slate-200">
                      {selectedStation.congestionLevel}%
                    </span>
                  </div>
                  {selectedStation.message ? (
                    <p className="mt-3 rounded-xl bg-white p-3 text-xs font-semibold leading-5 text-slate-600 ring-1 ring-slate-200">
                      {selectedStation.message}
                    </p>
                  ) : null}
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Clock3 className="h-5 w-5 text-sky-600" />
                      <h2 className="text-lg font-black text-slate-950">Lịch sắp đến</h2>
                    </div>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {isStationSchedulePinned ? selectedStation.name : "Toàn tuyến realtime"}
                    </p>
                  </div>
                  {isLoadingSchedule ? (
                    <span className="text-xs font-bold text-slate-400">Đang tải</span>
                  ) : null}
                </div>

                <div className="space-y-3">
                  {upcomingSchedules.length === 0 ? (
                    <div className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                      Chưa có lịch trình cho ga hoặc tuyến đang chọn.
                    </div>
                  ) : (
                    upcomingSchedules.map((schedule) => (
                      <button
                        key={schedule.id}
                        type="button"
                        onClick={() => {
                          if (schedule.stationId) selectStation(schedule.stationId);
                        }}
                        className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left transition hover:border-sky-200 hover:bg-sky-50"
                      >
                        <span className={`flex h-11 w-14 shrink-0 items-center justify-center rounded-2xl text-sm font-black text-white ${
                          schedule.source === "live" ? "bg-sky-600" : "bg-slate-950"
                        }`}>
                          {schedule.source === "live"
                            ? (schedule.etaText || `${schedule.minutesUntil ?? "--"}'`)
                            : formatClock(schedule.departureTime)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-black text-slate-950">
                            {schedule.stationName}
                          </span>
                          <span className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-slate-500">
                            {schedule.source === "live" && schedule.trainCode
                              ? schedule.trainCode
                              : schedule.routeName}
                            <ArrowRight className="h-3 w-3" />
                            {getScheduleStatus(schedule.status)}
                          </span>
                        </span>
                        <span className="text-xs font-black text-sky-700">
                          {schedule.minutesUntil === null ? "--" : `${schedule.minutesUntil}'`}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </section>
            </aside>
          </div>

          <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Radio className="h-5 w-5 text-sky-600" />
                <h2 className="text-lg font-black text-slate-950">Đoàn tàu trên tuyến</h2>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {displayTrains.map((train) => (
                  <button
                    key={train.id}
                    type="button"
                    onClick={() => setSelectedTrainId(train.id)}
                    className={`flex items-center justify-between rounded-2xl border p-3 text-left transition ${
                      selectedTrain.id === train.id
                        ? "border-sky-200 bg-sky-50"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white"
                        style={{ backgroundColor: trainFill[train.status] }}
                      >
                        <TrainFront className="h-5 w-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-black text-slate-950">
                          {train.code}
                        </span>
                        <span className="block truncate text-xs font-semibold text-slate-500">
                          {train.nextStation} · {train.eta}
                        </span>
                      </span>
                    </div>
                    <Navigation className="h-4 w-4 shrink-0 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-sky-600" />
                <h2 className="text-lg font-black text-slate-950">Tình hình vận hành</h2>
              </div>
              <div className="space-y-3">
                {[
                  {
                    icon: Gauge,
                    label: "Mật độ hệ thống",
                    value: `${averageOccupancy}%`,
                    text: "Dựa trên các đoàn tàu đang hiển thị.",
                  },
                  {
                    icon: AlertTriangle,
                    label: "Tàu cần chú ý",
                    value: delayedTrains,
                    text: delayedTrains > 0 ? "Có tàu đang báo trễ." : "Không có cảnh báo trễ.",
                  },
                  {
                    icon: Wrench,
                    label: "Ga bảo trì",
                    value: allDisplayStations.filter((station) => station.status === "maintenance").length,
                    text: "Theo trạng thái live của từng ga.",
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="rounded-2xl bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-sm font-black text-slate-950">
                          <Icon className="h-4 w-4 text-sky-600" />
                          {item.label}
                        </div>
                        <span className="text-sm font-black text-slate-950">{item.value}</span>
                      </div>
                      <p className="mt-1 text-xs font-semibold text-slate-500">{item.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      </PassengerShell>
    </>
  );
}
