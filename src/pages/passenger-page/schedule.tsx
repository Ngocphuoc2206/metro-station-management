import Head from "next/head";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import PassengerChatbotWidget from "@components/organisms/PassengerChatbot/PassengerChatbotWidget";
import PassengerHeader from "@components/templates/PassengerHeader";
import PassengerSidebar from "@components/templates/PassengerSidebar";
import { publicApi } from "@features/public/publicApi";
import type { RouteDto, StationDto } from "@features/public/publicTypes";
import { scheduleApi, scheduleErrorMessage } from "@features/schedule/scheduleApi";
import type { ScheduleDto } from "@features/schedule/scheduleTypes";
import {
  ChevronRight,
  Clock3,
  MapPinned,
  Search,
  SlidersHorizontal,
  TrainFront,
} from "lucide-react";

const parseTimeToSeconds = (value: string) => {
  const [hours = "0", minutes = "0", seconds = "0"] = value.split(":");
  const total =
    Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
  return Number.isFinite(total) ? total : null;
};

const formatSecondsAsTime = (totalSeconds: number) => {
  const normalized = ((totalSeconds % 86400) + 86400) % 86400;
  const hours = Math.floor(normalized / 3600);
  const minutes = Math.floor((normalized % 3600) / 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

const formatCountdown = (secondsUntilArrival: number) => {
  if (secondsUntilArrival <= 60) return "Sắp đến";
  const minutes = Math.ceil(secondsUntilArrival / 60);
  return `Còn ${minutes} phút`;
};

type ScheduleDisplayRow = {
  schedule: ScheduleDto;
  nextArrival: {
    time: string;
    countdown: string;
  };
  sortSeconds: number;
  arrivalState: "arrived" | "upcoming";
};

const lineKey = (schedule: ScheduleDto) =>
  `${schedule.routeId}::${schedule.direction || ""}`;

const getNextArrival = (
  schedule: ScheduleDto,
  now: Date,
) => {
  const baseArrivalSeconds = parseTimeToSeconds(schedule.arrivalTime);
  if (baseArrivalSeconds === null) {
    return { time: schedule.arrivalTime || "--", countdown: "" };
  }

  const frequencySeconds = Math.max(1, Number(schedule.frequencyMinutes || 0)) * 60;
  const nowSeconds =
    now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

  let nextArrivalSeconds = baseArrivalSeconds;
  if (nowSeconds > baseArrivalSeconds) {
    const elapsed = nowSeconds - baseArrivalSeconds;
    nextArrivalSeconds =
      baseArrivalSeconds + Math.ceil(elapsed / frequencySeconds) * frequencySeconds;
  }

  const displayArrivalSeconds = nextArrivalSeconds;
  const secondsUntilArrival =
    displayArrivalSeconds >= nowSeconds
      ? displayArrivalSeconds - nowSeconds
      : displayArrivalSeconds + 86400 - nowSeconds;

  return {
    time: formatSecondsAsTime(displayArrivalSeconds),
    countdown: formatCountdown(secondsUntilArrival),
  };
};

const getScheduleSeconds = (schedule: ScheduleDto) =>
  parseTimeToSeconds(schedule.arrivalTime || schedule.departureTime);

const getDisplayTimeSeconds = (value?: string) =>
  parseTimeToSeconds(value || "") ?? Number.MAX_SAFE_INTEGER;

const getForwardOffsetSeconds = (fromSeconds: number, toSeconds: number) =>
  toSeconds >= fromSeconds ? toSeconds - fromSeconds : toSeconds + 86400 - fromSeconds;

const buildLineRealtimeRows = (
  lineSchedules: ScheduleDto[],
  now: Date,
): ScheduleDisplayRow[] => {
  const sortedStops = [...lineSchedules].sort((a, b) => {
    const aSeconds = getScheduleSeconds(a) ?? 0;
    const bSeconds = getScheduleSeconds(b) ?? 0;
    return aSeconds - bSeconds;
  });

  if (sortedStops.length === 0) return [];

  const originSeconds = getScheduleSeconds(sortedStops[0]);
  if (originSeconds === null) {
    return sortedStops.map((schedule, index) => ({
      schedule,
      nextArrival: getNextArrival(schedule, now),
      sortSeconds: index,
      arrivalState: "upcoming" as const,
    }));
  }

  const frequencySeconds =
    Math.max(1, Number(sortedStops[0].frequencyMinutes || 0)) * 60;
  const nowSeconds =
    now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const stopOffsets = sortedStops.map((schedule) => {
    const stopSeconds = getScheduleSeconds(schedule);
    return stopSeconds === null
      ? 0
      : getForwardOffsetSeconds(originSeconds, stopSeconds);
  });
  const lastStopOffset = Math.max(...stopOffsets, 0);
  const journeyCycleSeconds = Math.max(lastStopOffset + frequencySeconds, frequencySeconds);
  const elapsedFromOrigin = getForwardOffsetSeconds(originSeconds, nowSeconds);
  let tripStartSeconds =
    originSeconds + Math.floor(elapsedFromOrigin / journeyCycleSeconds) * journeyCycleSeconds;
  const currentTripLastArrival = tripStartSeconds + lastStopOffset;

  if (currentTripLastArrival < nowSeconds) {
    tripStartSeconds += journeyCycleSeconds;
  }

  return sortedStops
    .map((schedule, index) => {
      const arrivalSeconds = tripStartSeconds + stopOffsets[index];
      const hasArrived = arrivalSeconds < nowSeconds;

      const secondsUntilArrival = arrivalSeconds - nowSeconds;

      return {
        schedule,
        nextArrival: {
          time: formatSecondsAsTime(arrivalSeconds),
          countdown: hasArrived ? "Đã đến" : formatCountdown(secondsUntilArrival),
        },
        sortSeconds: arrivalSeconds,
        arrivalState: hasArrived ? "arrived" as const : "upcoming" as const,
      };
    })
    .sort((a, b) => a.sortSeconds - b.sortSeconds);
};

export default function PassengerSchedulePage() {
  const [routes, setRoutes] = useState<RouteDto[]>([]);
  const [stations, setStations] = useState<StationDto[]>([]);
  const [schedules, setSchedules] = useState<ScheduleDto[]>([]);
  const [discoveredRouteIds, setDiscoveredRouteIds] = useState<string[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [selectedStationId, setSelectedStationId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState(() => new Date());

  const rememberRoutes = useCallback((items: ScheduleDto[]) => {
    setDiscoveredRouteIds((current) =>
      Array.from(new Set([...current, ...items.map((item) => item.routeId)])),
    );
  }, []);

  const loadSchedules = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!options?.silent) {
        setIsFiltering(true);
      }
      setLoadError(null);
      try {
        const source = selectedRouteId
          ? await scheduleApi.listByRoute(selectedRouteId)
          : await scheduleApi.list();
        rememberRoutes(source);
        setSchedules(
          source.filter(
            (item) =>
              (!selectedStationId || item.stationId === selectedStationId) &&
              (!selectedStatus || item.status === selectedStatus),
          ),
        );
        setLastUpdatedAt(new Date());
      } catch (err) {
        setLoadError(scheduleErrorMessage(err));
      } finally {
        if (!options?.silent) {
          setIsFiltering(false);
        }
      }
    },
    [rememberRoutes, selectedRouteId, selectedStationId, selectedStatus],
  );

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [routeResult, stationResult, scheduleResult] = await Promise.allSettled([
          publicApi.getRoutes(),
          publicApi.getStations(),
          scheduleApi.list(),
        ]);
        if (cancelled) return;
        if (routeResult.status === "fulfilled") setRoutes(routeResult.value);
        if (stationResult.status === "fulfilled") setStations(stationResult.value);
        if (scheduleResult.status === "fulfilled") {
          rememberRoutes(scheduleResult.value);
          setSchedules(scheduleResult.value);
          setLastUpdatedAt(new Date());
        } else {
          setLoadError(scheduleErrorMessage(scheduleResult.reason));
        }
      } catch (err) {
        if (!cancelled) setLoadError(scheduleErrorMessage(err));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [rememberRoutes]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      loadSchedules({ silent: true });
    }, 30_000);

    return () => window.clearInterval(intervalId);
  }, [loadSchedules]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 1_000);

    return () => window.clearInterval(intervalId);
  }, []);

  const stationName = (stationId: string) =>
    stations.find((station) => station.id === stationId)?.name ?? stationId;

  const selectedStationName =
    stations.find((station) => station.id === selectedStationId)?.name ?? "Tất cả ga";

  const availableRoutes = useMemo(() => {
    const routesById = new Map(routes.map((route) => [route.id, route]));
    discoveredRouteIds.forEach((routeId) => {
      if (!routesById.has(routeId)) {
        routesById.set(routeId, {
          id: routeId,
          name: `Tuyến ${routeId}`,
        });
      }
    });
    return Array.from(routesById.values());
  }, [discoveredRouteIds, routes]);

  const routeName = (routeId: string) =>
    availableRoutes.find((route) => route.id === routeId)?.name ?? routeId;

  const summaryCards = useMemo(() => {
    const averageFrequency = schedules.length
      ? Math.round(schedules.reduce((total, item) => total + item.frequencyMinutes, 0) / schedules.length)
      : 0;
    const activeCount = schedules.filter((item) => item.status === "ACTIVE").length;
    const onTimeRate = schedules.length ? Math.round((activeCount / schedules.length) * 100) : 0;
    const displayedRouteCount = new Set(schedules.map((item) => item.routeId)).size;
    return [
      { label: "Tần suất trung bình", value: `${averageFrequency} phút/chuyến`, tone: "text-blue-600", icon: Clock3, iconTone: "bg-blue-50 text-blue-600" },
      { label: "Chuyến đúng giờ", value: `${onTimeRate}%`, tone: "text-emerald-600", icon: TrainFront, iconTone: "bg-emerald-50 text-emerald-600" },
      { label: "Lịch trình hiển thị", value: `${schedules.length} chuyến`, tone: "text-slate-900", icon: SlidersHorizontal, iconTone: "bg-slate-100 text-slate-600" },
      { label: "Lịch trình hoạt động", value: `${activeCount} chuyến`, tone: "text-green-600", icon: TrainFront, iconTone: "bg-green-50 text-green-600" },
      { label: "Tuyến đang hiển thị", value: `${displayedRouteCount} tuyến`, tone: "text-blue-600", icon: MapPinned, iconTone: "bg-sky-50 text-sky-600" },
    ];
  }, [schedules]);

  const activeSchedules = schedules.filter((item) => item.status === "ACTIVE").length;
  const delayedSchedules = schedules.filter((item) => item.status === "DELAYED");
  const routeCount = new Set(schedules.map((item) => item.routeId)).size;
  const scheduleRows = useMemo<ScheduleDisplayRow[]>(() => {
    if (selectedStationId) {
      return schedules
        .map((schedule) => {
          const nextArrival = getNextArrival(schedule, currentTime);
          return {
            schedule,
            nextArrival,
            sortSeconds: getDisplayTimeSeconds(nextArrival.time),
            arrivalState: "upcoming" as const,
          };
        })
        .sort((a, b) => b.sortSeconds - a.sortSeconds);
    }

    const groupedSchedules = new Map<string, ScheduleDto[]>();
    schedules.forEach((schedule) => {
      const key = lineKey(schedule);
      groupedSchedules.set(key, [...(groupedSchedules.get(key) ?? []), schedule]);
    });

    return Array.from(groupedSchedules.values())
      .flatMap((items) => buildLineRealtimeRows(items, currentTime))
      .sort((a, b) => getDisplayTimeSeconds(b.nextArrival.time) - getDisplayTimeSeconds(a.nextArrival.time));
  }, [currentTime, schedules, selectedStationId]);

  const applyFilters = async () => {
    await loadSchedules();
  };

  const resetFilters = async () => {
    setSelectedRouteId("");
    setSelectedStationId("");
    setSelectedStatus("");
    setIsFiltering(true);
    setLoadError(null);
    try {
      const source = await scheduleApi.list();
      rememberRoutes(source);
      setSchedules(source);
      setLastUpdatedAt(new Date());
    } catch (err) {
      setLoadError(scheduleErrorMessage(err));
    } finally {
      setIsFiltering(false);
    }
  };

  const statusLabel = (status: string) => {
    if (status === "ACTIVE") return "Đúng giờ";
    if (status === "DELAYED") return "Trễ";
    if (status === "INACTIVE") return "Tạm ngưng";
    return status || "--";
  };

  const directionLabel = (item: ScheduleDto) => {
    const direction = item.direction === "OUTBOUND" ? "Chiều đi" : item.direction === "INBOUND" ? "Chiều về" : item.direction;
    return `${direction || "--"} - ${stationName(item.stationId)}`;
  };

  return (
    <>
      <Head>
        <title>Lịch tàu | MetroNext</title>
      </Head>

      <div className="passenger-page-shell min-h-screen w-full bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_45%,#f8fafc_100%)]">
        <div className="flex min-h-screen w-full">
          <PassengerSidebar />

          <main className="flex min-w-0 flex-1 flex-col">
            <PassengerHeader searchPlaceholder="Tìm kiếm ga, chuyến tàu..." />

            <section className="flex-1 p-4 sm:p-8">
              <div className="mx-auto max-w-[1400px] space-y-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                    <span>Hành khách</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                    <span className="text-slate-900">Lịch tàu</span>
                  </div>
                  <h1 className="text-3xl font-black leading-tight text-slate-900 sm:text-4xl">Lịch tàu</h1>
                </div>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-5">
                  {summaryCards.map((card) => {
                    const Icon = card.icon;
                    return (
                    <article
                      key={card.label}
                      className="grid min-h-28 grid-cols-[2.75rem_minmax(0,1fr)] items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${card.iconTone}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[10px] font-bold uppercase leading-4 tracking-wide text-slate-500">{card.label}</p>
                        <p className={`mt-1 whitespace-nowrap text-xl font-black leading-7 ${card.tone}`}>{card.value}</p>
                      </div>
                    </article>
                    );
                  })}
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
                  <div className="hidden flex-col gap-3 border-b border-slate-100 pb-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-2 text-slate-900">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600">
                        <SlidersHorizontal className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold leading-5">Bộ lọc lịch tàu</p>
                        <p className="text-xs text-slate-500">Tùy chỉnh tuyến, ga và khung giờ bạn muốn theo dõi</p>
                      </div>
                    </div>

                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                      <button type="button" onClick={resetFilters} disabled={isFiltering} className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 disabled:opacity-50">
                        Đặt lại
                      </button>
                      <button type="button" onClick={applyFilters} disabled={isFiltering} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 disabled:opacity-50">
                        {isFiltering ? "Đang tải..." : "Áp dụng bộ lọc"}
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_9rem] lg:items-end">
                    <label className="space-y-1.5">
                      <span className="px-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">Chọn tuyến</span>
                      <select value={selectedRouteId} onChange={(event) => setSelectedRouteId(event.target.value)} className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none focus:border-blue-400">
                        <option value="">Tất cả tuyến</option>
                        {availableRoutes.map((route) => <option key={route.id} value={route.id}>{route.name}</option>)}
                      </select>
                    </label>

                    <label className="space-y-1.5">
                      <span className="px-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">Chọn ga</span>
                      <select value={selectedStationId} onChange={(event) => setSelectedStationId(event.target.value)} className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none focus:border-blue-400">
                        <option value="">Tất cả ga</option>
                        {stations.map((station) => <option key={station.id} value={station.id}>{station.name}</option>)}
                      </select>
                    </label>

                    <label className="space-y-1.5">
                      <span className="px-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">Trạng thái</span>
                      <select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value)} className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none focus:border-blue-400">
                        <option value="">Tất cả trạng thái</option>
                        <option value="ACTIVE">Đúng giờ</option>
                        <option value="DELAYED">Trễ</option>
                        <option value="INACTIVE">Tạm ngưng</option>
                      </select>
                    </label>

                    <button type="button" onClick={applyFilters} disabled={isFiltering} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 disabled:opacity-50">
                      <Search className="h-4 w-4" />
                      {isFiltering ? "Đang tải..." : "Tìm kiếm"}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">Lịch tàu theo thời gian thực</h2>
                        <p className="mt-0.5 text-xs font-medium text-slate-500">
                          {lastUpdatedAt
                            ? `Tự cập nhật mỗi 30 giây · Lần cuối ${lastUpdatedAt.toLocaleTimeString("vi-VN", { hour12: false })}`
                            : "Đang chờ dữ liệu cập nhật"}
                        </p>
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{selectedStationName}</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-[760px] w-full table-fixed text-left">
                        <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase text-slate-500">
                          <tr>
                            <th className="w-[46%] px-6 py-4">Tuyến / hướng đi</th>
                            <th className="w-[18%] px-6 py-4">Giờ đến dự kiến</th>
                            <th className="w-[18%] px-6 py-4">Giờ khởi hành</th>
                            <th className="w-[18%] px-6 py-4 text-right">Tình trạng</th>
                          </tr>
                        </thead>
                        <tbody>
                          {isLoading ? (
                            <tr><td colSpan={4} className="px-6 py-10 text-center text-sm text-slate-500">Đang tải lịch trình...</td></tr>
                          ) : loadError ? (
                            <tr><td colSpan={4} className="px-6 py-10 text-center text-sm font-medium text-red-600">{loadError}</td></tr>
                          ) : scheduleRows.length === 0 ? (
                            <tr><td colSpan={4} className="px-6 py-10 text-center text-sm text-slate-500">Không có lịch trình phù hợp.</td></tr>
                          ) : scheduleRows.map(({ schedule: row, nextArrival, arrivalState }) => {
                            return (
                              <tr
                                key={row.id}
                                className={`border-t border-slate-100 transition-colors hover:bg-blue-50/40 ${
                                  arrivalState === "arrived"
                                    ? "bg-slate-50/70"
                                    : row.status === "DELAYED" ? "bg-red-50/30" : "bg-white"
                                }`}
                              >
                                <td className="px-6 py-4">
                                  <p className="text-sm font-semibold text-slate-900">{routeName(row.routeId)}</p>
                                  <p className="mt-1 text-xs font-medium text-slate-500">{directionLabel(row)}</p>
                                </td>
                                <td
                                  className={`px-6 py-4 text-sm font-bold ${
                                    arrivalState === "arrived"
                                      ? "text-slate-500"
                                      : row.status === "DELAYED" ? "text-red-600" : "text-blue-600"
                                  }`}
                                >
                                  <div>{nextArrival.time}</div>
                                  {nextArrival.countdown ? (
                                    <div className="mt-1 text-xs font-semibold text-slate-500">
                                      {nextArrival.countdown}
                                    </div>
                                  ) : null}
                                </td>
                                <td className="px-6 py-4 text-sm font-semibold text-slate-900">{row.departureTime}</td>
                                <td className="px-6 py-4 text-right">
                                  <span
                                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                                      arrivalState === "arrived"
                                        ? "bg-blue-50 text-blue-700"
                                        : row.status === "DELAYED"
                                        ? "bg-red-100 text-red-700"
                                        : row.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700"
                                    }`}
                                  >
                                    {arrivalState === "arrived" ? "Đã đến" : statusLabel(row.status)}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="hidden flex-col gap-6 xl:sticky xl:top-6 xl:self-start">
                    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                      <div className="flex items-center justify-between bg-blue-600 px-4 py-4 text-white">
                        <div className="flex items-center gap-2 text-base font-bold">
                          <Clock3 className="h-4 w-4" />
                          <span>Trạng thái lịch trình</span>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wide text-white/80">Từ API</span>
                      </div>

                      <div className="space-y-3 p-4">
                        <article className="flex gap-3 rounded-2xl bg-slate-50 p-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10 text-green-600">
                            <TrainFront className="h-4 w-4" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-900">{activeSchedules} lịch trình đang hoạt động</h3>
                            <p className="mt-1 text-xs leading-4 text-slate-500">
                              Dữ liệu đang hiển thị trên {routeCount} tuyến.
                            </p>
                          </div>
                        </article>

                        {delayedSchedules.length ? (
                          delayedSchedules.slice(0, 2).map((schedule) => (
                            <article key={schedule.id} className="flex gap-3 rounded-2xl bg-red-50 p-3">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-600">
                                <Clock3 className="h-4 w-4" />
                              </div>
                              <div>
                                <h3 className="text-sm font-bold text-slate-900">Lịch trình bị trễ</h3>
                                <p className="mt-1 text-xs leading-4 text-slate-500">
                                  {routeName(schedule.routeId)} - {stationName(schedule.stationId)} lúc {schedule.departureTime}.
                                </p>
                              </div>
                            </article>
                          ))
                        ) : (
                          <p className="rounded-2xl bg-emerald-50 p-3 text-xs font-medium text-emerald-700">
                            Không có lịch trình trễ trong danh sách đang hiển thị.
                          </p>
                        )}
                      </div>
                    </div>

                    <Link
                      href="/passenger-page/live-map"
                      className="relative block h-48 overflow-hidden rounded-3xl border border-slate-200 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <img
                        src="https://placehold.co/295x190"
                        alt="Bản đồ tàu"
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/25 to-black/0" />
                      <div className="absolute inset-0 flex items-end p-6 text-white">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-white/80">Xem bản đồ trực tuyến</p>
                          <h3 className="mt-1 text-lg font-bold">Vị trí tàu hiện tại</h3>
                          <div className="mt-2 flex items-center gap-2 text-xs font-medium">
                            <MapPinned className="h-3.5 w-3.5 text-blue-300" />
                            Đang hiển thị {schedules.length} lịch trình
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          </main>
        </div>
        <PassengerChatbotWidget />
      </div>
    </>
  );
}
