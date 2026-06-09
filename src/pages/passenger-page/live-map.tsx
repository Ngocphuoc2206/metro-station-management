import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import PassengerShell from "@components/templates/PassengerShell";
import { liveApi, liveErrorMessage } from "@features/live/liveApi";
import type {
  LiveStationStatusDto,
  LiveTrainDto,
} from "@features/live/liveTypes";
import { publicApi } from "@features/public/publicApi";
import type { RouteDto, StationDto } from "@features/public/publicTypes";
import { routeApi } from "@features/route/routeApi";
import type { Route as MetroRoute } from "@features/route/routeTypes";
import {
  scheduleApi,
  scheduleErrorMessage,
} from "@features/schedule/scheduleApi";
import type { ScheduleDto } from "@features/schedule/scheduleTypes";
import {
  buildScheduleLines,
  etaMinutes,
  getNowSeconds,
  lerp,
  normalizeDirection,
  resolveApproachingTrainOnLine,
  resolvePositionFromNextStation,
} from "@utils/metroScheduleProgress";
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
  Radio,
  Route as RouteIcon,
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
  previousStationId?: string;
  previousStation?: string;
  nextStationId?: string;
  nextStation: string;
  eta: string;
  arrivalClock?: string;
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
  {
    id: "ben-thanh",
    name: "Bến Thành",
    x: 82,
    y: 355,
    status: "busy",
    congestionLevel: 78,
  },
  {
    id: "opera",
    name: "Nhà hát TP",
    x: 172,
    y: 316,
    status: "normal",
    congestionLevel: 42,
  },
  {
    id: "ba-son",
    name: "Ba Son",
    x: 270,
    y: 280,
    status: "normal",
    congestionLevel: 36,
  },
  {
    id: "van-thanh",
    name: "Văn Thánh",
    x: 382,
    y: 244,
    status: "normal",
    congestionLevel: 48,
  },
  {
    id: "tan-cang",
    name: "Tân Cảng",
    x: 500,
    y: 220,
    status: "busy",
    congestionLevel: 72,
  },
  {
    id: "thao-dien",
    name: "Thảo Điền",
    x: 622,
    y: 190,
    status: "normal",
    congestionLevel: 40,
  },
  {
    id: "an-phu",
    name: "An Phú",
    x: 740,
    y: 160,
    status: "normal",
    congestionLevel: 31,
  },
  {
    id: "rach-chiec",
    name: "Rạch Chiếc",
    x: 850,
    y: 128,
    status: "normal",
    congestionLevel: 34,
  },
  {
    id: "suoi-tien",
    name: "Suối Tiên",
    x: 950,
    y: 100,
    status: "normal",
    congestionLevel: 45,
  },
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
  arriving: "Đang tới ga",
};

const statusClass: Record<TrainStatus, string> = {
  "on-time": "bg-emerald-50 text-emerald-700 ring-emerald-200",
  delayed: "bg-rose-50 text-rose-700 ring-rose-200",
  arriving: "bg-sky-50 text-sky-700 ring-sky-200",
};

const trainFill: Record<TrainStatus, string> = {
  "on-time": "#16A34A",
  delayed: "#E11D48",
  arriving: "#F97316",
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
  if (
    status.includes("DELAY") ||
    status.includes("LATE") ||
    status.includes("TRỄ")
  ) {
    return "delayed";
  }
  if (
    status.includes("ARRIV") ||
    status.includes("APPROACH") ||
    status.includes("ĐẾN")
  ) {
    return "arriving";
  }
  return "on-time";
};

const mapStationStatus = (
  value: string,
  congestionLevel = 0,
): StationStatus => {
  const status = value.toUpperCase();
  if (
    status.includes("MAINTENANCE") ||
    status.includes("CLOSED") ||
    status.includes("BẢO")
  ) {
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

const getStationId = (station: LiveStationStatusDto) =>
  station.stationId || station.id;

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

const formatClock = (value: string) => {
  const match = value?.match(/(\d{1,2}):(\d{2})/);
  return match ? `${match[1].padStart(2, "0")}:${match[2]}` : value || "--:--";
};

const formatMinutesUntil = (minutes: number | null) => {
  if (minutes === null) return "--";
  if (minutes <= 0) return "Sắp đến";
  if (minutes < 60) return `${minutes} phút`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0
    ? `${hours} giờ ${remainingMinutes} phút`
    : `${hours} giờ`;
};

const formatCompactMinutesUntil = (minutes: number | null) => {
  if (minutes === null) return "--";
  if (minutes <= 0) return "0'";
  if (minutes < 60) return `${minutes}'`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}p` : `${hours}h`;
};

const getScheduleStatus = (status: string) => {
  const value = status.toUpperCase();
  if (value.includes("DELAY") || value.includes("TRỄ")) return "Trễ";
  if (
    value.includes("CANCEL") ||
    value.includes("HUỶ") ||
    value.includes("HỦY")
  )
    return "Huỷ";
  if (value.includes("ACTIVE") || value.includes("ON")) return "Đang chạy";
  return status || "Theo lịch";
};

const fallbackPosition = (index: number, count: number) => {
  if (fallbackStations.length === 0) return { x: 82 + index * 96, y: 355 };
  if (count <= 1) return fallbackStations[0];

  const scaledIndex = (index / (count - 1)) * (fallbackStations.length - 1);
  const leftIndex = Math.floor(scaledIndex);
  const rightIndex = Math.min(fallbackStations.length - 1, leftIndex + 1);
  const progress = scaledIndex - leftIndex;
  const left = fallbackStations[leftIndex];
  const right = fallbackStations[rightIndex];

  return {
    x: lerp(left.x, right.x, progress),
    y: lerp(left.y, right.y, progress),
  };
};

const toRouteOption = (route: MetroRoute): RouteDto => ({
  id: route.id,
  name: route.name,
  description: route.description,
  color: route.color,
});

const stationsFromRouteDetails = (routeDetails: MetroRoute[]): StationDto[] => {
  const byId = new Map<string, StationDto>();
  routeDetails.forEach((route) => {
    route.stations?.forEach((station) => {
      if (!station.stationId || byId.has(station.stationId)) return;
      byId.set(station.stationId, {
        id: station.stationId,
        name: station.stationName || station.stationId,
      });
    });
  });
  return Array.from(byId.values());
};

export default function PassengerLiveMapPage() {
  const [routes, setRoutes] = useState<RouteDto[]>([]);
  const [routeDetails, setRouteDetails] = useState<MetroRoute[]>([]);
  const [requestedRouteDetailIds, setRequestedRouteDetailIds] = useState<string[]>([]);
  const [schedules, setSchedules] = useState<ScheduleDto[]>([]);
  const [stationStatuses, setStationStatuses] = useState<
    LiveStationStatusDto[]
  >([]);
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
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    let cancelled = false;

    const loadCatalog = async () => {
      const routeResult = await Promise.resolve(routeApi.getRoutes()).then(
        (value) => ({ status: "fulfilled" as const, value }),
        (reason) => ({ status: "rejected" as const, reason }),
      );

      if (cancelled) return;

      if (routeResult.status === "fulfilled") {
        setRouteDetails(routeResult.value);
        setRoutes(routeResult.value.map(toRouteOption));
      } else {
        setRouteDetails([]);
        try {
          const fallbackRoutes = await publicApi.getRoutes();
          if (!cancelled) setRoutes(fallbackRoutes);
        } catch {
          if (!cancelled) setRoutes([]);
        }
      }
    };

    loadCatalog();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 1_000);

    return () => window.clearInterval(intervalId);
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
    if (!selectedRouteId) return;
    const currentRoute = routeDetails.find((route) => route.id === selectedRouteId);
    if (currentRoute?.stations?.length) return;
    if (requestedRouteDetailIds.includes(selectedRouteId)) return;

    let cancelled = false;
    setRequestedRouteDetailIds((current) =>
      current.includes(selectedRouteId) ? current : [...current, selectedRouteId],
    );

    routeApi
      .getRouteById(selectedRouteId)
      .then((route) => {
        if (cancelled) return;
        setRouteDetails((current) => {
          const others = current.filter((item) => item.id !== route.id);
          return [...others, route];
        });
        setRoutes((current) => {
          const option = toRouteOption(route);
          return current.some((item) => item.id === option.id)
            ? current.map((item) => (item.id === option.id ? option : item))
            : [...current, option];
        });
      })
      .catch(() => {
        // Route detail only improves station ordering; schedule-based rendering still works without it.
      });

    return () => {
      cancelled = true;
    };
  }, [requestedRouteDetailIds, routeDetails, selectedRouteId]);

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
            : liveStations[0]
              ? getStationId(liveStations[0])
              : "",
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

  const stationsApi = useMemo(
    () => stationsFromRouteDetails(routeDetails),
    [routeDetails],
  );

  const stationNameById = useMemo(
    () => new Map(stationsApi.map((station) => [station.id, station.name])),
    [stationsApi],
  );

  const routeNameById = useMemo(
    () => new Map(routes.map((route) => [route.id, route.name])),
    [routes],
  );

  const routeStationOrder = useMemo(() => {
    const byRoute = new Map<string, Map<string, number>>();

    routeDetails.forEach((route) => {
      const orderedStations = [...(route.stations ?? [])].sort(
        (a, b) => a.sequenceOrder - b.sequenceOrder,
      );
      byRoute.set(
        route.id,
        new Map(
          orderedStations.map((station, index) => [
            station.stationId,
            station.sequenceOrder ?? index,
          ]),
        ),
      );
    });

    return byRoute;
  }, [routeDetails]);

  const routeStationNameById = useMemo(() => {
    const names = new Map<string, string>();
    routeDetails.forEach((route) => {
      route.stations?.forEach((station) => {
        if (station.stationId && station.stationName) {
          names.set(station.stationId, station.stationName);
        }
      });
    });
    return names;
  }, [routeDetails]);

  const scheduleStationNameById = useMemo(() => {
    const names = new Map<string, string>();
    schedules.forEach((schedule) => {
      if (schedule.stationId && schedule.stationName) {
        names.set(schedule.stationId, schedule.stationName);
      }
    });
    return names;
  }, [schedules]);

  const scheduleLines = useMemo(
    () => buildScheduleLines(schedules, routeStationOrder),
    [routeStationOrder, schedules],
  );

  const allDisplayStations = useMemo<Station[]>(() => {
    const pushUnique = (items: string[], stationId?: string) => {
      if (stationId && !items.includes(stationId)) items.push(stationId);
    };

    const stationIds: string[] = [];
    const relevantRoutes = selectedRouteId
      ? routeDetails.filter((route) => route.id === selectedRouteId)
      : routeDetails;

    relevantRoutes.forEach((route) => {
      [...(route.stations ?? [])]
        .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
        .forEach((station) => pushUnique(stationIds, station.stationId));
    });

    scheduleLines.forEach((line) => {
      if (!selectedRouteId || line.routeId === selectedRouteId) {
        line.stops.forEach((schedule) => pushUnique(stationIds, schedule.stationId));
      }
    });

    if (!selectedRouteId || stationIds.length === 0) {
      stationStatuses.forEach((station) => pushUnique(stationIds, getStationId(station)));
    }

    if (stationIds.length === 0 && !selectedRouteId) {
      stationsApi.forEach((station) => pushUnique(stationIds, station.id));
    }

    if (stationIds.length === 0) return fallbackStations;

    const statusById = new Map(
      stationStatuses.map((station) => [getStationId(station), station]),
    );
    const catalogById = new Map(stationsApi.map((station) => [station.id, station]));
    const stationCoordinates = stationIds
      .map((stationId) => catalogById.get(stationId))
      .filter(
        (station): station is StationDto =>
          Number.isFinite(station?.latitude) && Number.isFinite(station?.longitude),
      );
    const latitudes = stationCoordinates.map((station) => Number(station.latitude));
    const longitudes = stationCoordinates.map((station) => Number(station.longitude));
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);
    const hasGeoBounds =
      stationCoordinates.length > 1 && (maxLat > minLat || maxLng > minLng);

    return stationIds.map((stationId, index) => {
      const liveStation = statusById.get(stationId);
      const catalogStation = catalogById.get(stationId);
      const fallback = fallbackPosition(index, stationIds.length);
      const geoX =
        hasGeoBounds && catalogStation?.longitude !== undefined
          ? 82 + ((Number(catalogStation.longitude) - minLng) / Math.max(0.000001, maxLng - minLng)) * 868
          : undefined;
      const geoY =
        hasGeoBounds && catalogStation?.latitude !== undefined
          ? 100 + (1 - (Number(catalogStation.latitude) - minLat) / Math.max(0.000001, maxLat - minLat)) * 255
          : undefined;
      const congestionLevel = Math.min(
        100,
        Math.max(0, liveStation?.congestionLevel ?? 0),
      );

      return {
        id: stationId,
        name:
          scheduleStationNameById.get(stationId) ??
          stationNameById.get(stationId) ??
          routeStationNameById.get(stationId) ??
          liveStation?.name ??
          fallbackStations[index]?.name ??
          stationId,
        x: liveStation?.x ?? geoX ?? fallback.x,
        y: liveStation?.y ?? geoY ?? fallback.y,
        status: mapStationStatus(liveStation?.status ?? "", congestionLevel),
        congestionLevel,
        message: liveStation?.message,
        updatedAt: liveStation?.updatedAt,
      };
    });
  }, [
    routeDetails,
    routeStationNameById,
    scheduleStationNameById,
    scheduleLines,
    selectedRouteId,
    stationNameById,
    stationStatuses,
    stationsApi,
  ]);

  const stationById = useMemo(
    () => new Map(allDisplayStations.map((station) => [station.id, station])),
    [allDisplayStations],
  );

  const scheduledTrains = useMemo<Train[]>(() => {
    const activeLines = scheduleLines.filter(
      (line) => !selectedRouteId || line.routeId === selectedRouteId,
    );
    const nowSeconds = getNowSeconds(currentTime);

    return activeLines
      .map((line, index) =>
        resolveApproachingTrainOnLine(line, nowSeconds, stationById, index),
      )
      .filter(Boolean) as Train[];
  }, [currentTime, scheduleLines, selectedRouteId, stationById]);

  const displayTrains = useMemo<Train[]>(() => {
    const mappedLive =
      trainLocations.length > 0
        ? trainLocations.map((train, index) => {
            const direction = normalizeDirection(train.direction);
            const matchingLine =
              scheduleLines.find((line) => {
                const matchesRoute = !train.routeId || line.routeId === train.routeId;
                const matchesDirection =
                  !direction || normalizeDirection(line.direction) === direction;
                const matchesStation =
                  !train.nextStationId ||
                  line.stops.some((stop) => stop.stationId === train.nextStationId);
                return matchesRoute && matchesDirection && matchesStation;
              }) ??
              scheduleLines.find((line) => {
                const matchesRoute = !train.routeId || line.routeId === train.routeId;
                return (
                  matchesRoute &&
                  line.stops.some((stop) => stop.stationId === train.nextStationId)
                );
              });
            const schedulePosition = matchingLine
              ? resolvePositionFromNextStation(
                  matchingLine,
                  train.nextStationId,
                  train.nextStationName,
                  train.eta,
                  stationById,
                  getNowSeconds(currentTime),
                )
              : null;
            const nextStationId = schedulePosition?.nextStationId ?? train.nextStationId;
            const fallback =
              (nextStationId ? stationById.get(nextStationId) : undefined) ??
              fallbackTrains[index] ??
              fallbackPosition(index, trainLocations.length);
            const apiStatus = mapTrainStatus(train.status);
            const inferredStatus =
              schedulePosition?.status === "delayed"
                ? "delayed"
                : apiStatus === "on-time" && schedulePosition?.status === "arriving"
                ? "arriving"
                : apiStatus;

            return {
              id: train.id,
              code: train.code,
              direction: train.direction || matchingLine?.direction || "--",
              previousStationId: schedulePosition?.previousStationId,
              previousStation: schedulePosition?.previousStationName,
              nextStationId,
              nextStation:
                schedulePosition?.nextStationName ||
                train.nextStationName ||
                train.nextStationId ||
                "--",
              eta: train.eta || schedulePosition?.eta || "--",
              arrivalClock: schedulePosition?.arrivalClock,
              occupancy: Math.min(100, Math.max(0, train.occupancy)),
              status:
                train.status || !schedulePosition
                  ? inferredStatus
                  : schedulePosition.status,
              x: schedulePosition?.x ?? train.x ?? fallback.x,
              y: schedulePosition?.y ?? train.y ?? fallback.y,
              routeId: train.routeId ?? matchingLine?.routeId,
            };
          })
        : [];

    const mapped = mappedLive.length > 0 ? mappedLive : scheduledTrains;

    return mapped.filter((train) => {
      const normalizedSearch = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !normalizedSearch ||
        train.code.toLowerCase().includes(normalizedSearch) ||
        train.nextStation.toLowerCase().includes(normalizedSearch);
      const matchesRoute =
        !selectedRouteId || train.routeId === selectedRouteId || !train.routeId;
      return matchesSearch && matchesRoute;
    });
  }, [
    currentTime,
    scheduleLines,
    scheduledTrains,
    searchTerm,
    selectedRouteId,
    stationById,
    trainLocations,
  ]);

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
        routesById.set(train.routeId, {
          id: train.routeId,
          name: `Tuyến ${train.routeId}`,
        });
      }
    });
    schedules.forEach((schedule) => {
      if (schedule.routeId && !routesById.has(schedule.routeId)) {
        routesById.set(schedule.routeId, {
          id: schedule.routeId,
          name: `Tuyến ${schedule.routeId}`,
        });
      }
    });
    return Array.from(routesById.values());
  }, [routes, schedules, trainLocations]);

  const resolvedRouteName = useMemo(() => {
    const route = routes.find((item) => item.id === selectedRouteId);
    return (
      route?.name ??
      (selectedRouteId ? `Tuyến ${selectedRouteId}` : "Tất cả tuyến")
    );
  }, [routes, selectedRouteId]);

  const upcomingSchedules = useMemo<ScheduleStop[]>(() => {
    const routeFiltered = schedules.filter(
      (schedule) => !selectedRouteId || schedule.routeId === selectedRouteId,
    );
    const stationFiltered =
      isStationSchedulePinned && selectedStation.id
        ? routeFiltered.filter(
            (schedule) => schedule.stationId === selectedStation.id,
          )
        : routeFiltered;

    const scheduleStops = stationFiltered
      .map((schedule) => ({
        ...schedule,
        stationName:
          schedule.stationName ??
          scheduleStationNameById.get(schedule.stationId) ??
          stationNameById.get(schedule.stationId) ??
          routeStationNameById.get(schedule.stationId) ??
          schedule.stationId,
        routeName:
          routeNameById.get(schedule.routeId) ?? `Tuyến ${schedule.routeId}`,
        minutesUntil: minutesUntil(
          schedule.departureTime || schedule.arrivalTime,
        ),
        source: "schedule" as const,
      }))
      .filter(
        (schedule) =>
          schedule.minutesUntil === null || schedule.minutesUntil >= 0,
      );

    const liveStops = displayTrains
      .filter(
        (train) =>
          !isStationSchedulePinned ||
          train.nextStationId === selectedStation.id,
      )
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
          ? (routeNameById.get(train.routeId) ?? `Tuyến ${train.routeId}`)
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
    routeStationNameById,
    schedules,
    scheduleStationNameById,
    selectedRouteId,
    selectedStation.id,
    stationNameById,
  ]);

  const linePath =
    allDisplayStations.length > 1
      ? allDisplayStations
          .map((station) => `${station.x},${station.y}`)
          .join(" ")
      : "";
  const activeStations = allDisplayStations.filter(
    (station) => station.status !== "maintenance",
  ).length;
  const delayedTrains = displayTrains.filter(
    (train) => train.status === "delayed",
  ).length;
  const averageOccupancy = displayTrains.length
    ? Math.round(
        displayTrains.reduce((sum, train) => sum + train.occupancy, 0) /
          displayTrains.length,
      )
    : 0;
  const nextSchedule = upcomingSchedules[0];
  const hasLiveData = stationStatuses.length > 0 || trainLocations.length > 0;
  const hasOperationalData = hasLiveData || schedules.length > 0;

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
                Xem vị trí tàu, mật độ ga và các chuyến sắp khởi hành theo thời
                gian thực.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">
                <Wifi className="h-4 w-4" />
                {hasLiveData ? "Live" : schedules.length ? "Theo lịch" : "Live"}
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
                  value: isLoadingLive
                    ? "--"
                    : `${activeStations}/${allDisplayStations.length}`,
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
                  <article
                    key={card.label}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          {card.label}
                        </p>
                        <p className="mt-2 text-3xl font-black text-slate-950">
                          {card.value}
                        </p>
                      </div>
                      <span
                        className={`flex h-10 w-10 items-center justify-center rounded-2xl ${card.tone}`}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>

            <article className="rounded-2xl border border-sky-100 bg-sky-50 p-4 text-slate-950 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-sky-700">
                <Signal className="h-4 w-4 text-emerald-500" />
                Chuyến gần nhất
              </div>
              <p className="mt-3 text-2xl font-black">
                {nextSchedule
                  ? nextSchedule.source === "live"
                    ? nextSchedule.etaText ||
                      formatMinutesUntil(nextSchedule.minutesUntil)
                    : formatClock(nextSchedule.departureTime)
                  : "--:--"}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-600">
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

          <div className="grid gap-5 xl:grid-cols-[minmax(0,54rem)_22rem] xl:justify-center">
            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                    <MapPinned className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-lg font-black text-slate-950">
                      {resolvedRouteName}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Chọn tàu hoặc ga để xem lịch trình và trạng thái chi tiết.
                    </p>
                  </div>
                </div>

                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                  <label className="relative min-w-48">
                    <RouteIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <select
                      value={selectedRouteId}
                      onChange={(event) =>
                        setSelectedRouteId(event.target.value)
                      }
                      className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
                    >
                      <option value="">Tất cả tuyến</option>
                      {availableRoutes.map((route) => (
                        <option key={route.id} value={route.id}>
                          {route.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="relative min-w-48">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Tìm ga hoặc mã tàu"
                      className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
                    />
                  </label>
                </div>
              </div>

              <div className="relative min-h-120 overflow-x-auto overflow-y-hidden bg-[#f7fbf8]">
                <div className="absolute inset-0 bg-[linear-gradient(28deg,transparent_0_42%,rgba(245,158,11,0.16)_42%_44%,transparent_44%_100%),linear-gradient(118deg,transparent_0_54%,rgba(248,113,113,0.13)_54%_56%,transparent_56%_100%),linear-gradient(154deg,transparent_0_64%,rgba(59,130,246,0.12)_64%_67%,transparent_67%_100%),linear-gradient(rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.10)_1px,transparent_1px)] bg-[size:360px_260px,430px_300px,520px_360px,64px_64px,64px_64px]" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.78),rgba(255,255,255,0.34))]" />

                <svg
                  className="relative z-10 h-120 w-full min-w-200"
                  viewBox="0 0 1040 500"
                  role="img"
                  aria-label="Bản đồ trực tuyến tuyến metro"
                >
                  {linePath ? (
                    <>
                      <polyline
                        points={linePath}
                        fill="none"
                        stroke="rgba(3,105,161,0.15)"
                        strokeWidth="34"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <polyline
                        points={linePath}
                        fill="none"
                        stroke="#0284C7"
                        strokeWidth="11"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <polyline
                        points={linePath}
                        fill="none"
                        stroke="rgba(255,255,255,0.72)"
                        strokeWidth="2.5"
                        strokeDasharray="10 16"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </>
                  ) : null}

                  {allDisplayStations.map((station, index) => {
                    const isSelected = selectedStation.id === station.id;
                    const isDimmed =
                      searchTerm.trim() &&
                      !station.name
                        .toLowerCase()
                        .includes(searchTerm.trim().toLowerCase());
                    const labelAbove = index % 2 === 1;
                    const labelY = labelAbove ? station.y - 48 : station.y + 24;

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
                          fill="rgba(14,116,144,0.12)"
                        />
                        <circle
                          cx={station.x}
                          cy={station.y}
                          r={isSelected ? 14 : 11}
                          className={stationDotClass[station.status]}
                          strokeWidth="4"
                        />
                        <foreignObject
                          x={station.x - 68}
                          y={labelY}
                          width="136"
                          height="42"
                          pointerEvents="none"
                        >
                          <div className="mx-auto max-w-32 rounded-xl border border-white bg-white/92 px-2.5 py-1.5 text-center text-[11px] font-black leading-3 text-slate-900 shadow-sm">
                            <div className="truncate">{station.name}</div>
                            {station.congestionLevel > 0 ? (
                              <div className="mt-0.5 text-[10px] font-bold text-slate-500">
                                {station.congestionLevel}%
                              </div>
                            ) : null}
                          </div>
                        </foreignObject>
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
                          r={isSelected ? 38 : 31}
                          fill="rgba(15,23,42,0.18)"
                          transform={`translate(3 5)`}
                        />
                        <circle
                          cx={train.x}
                          cy={train.y}
                          r={isSelected ? 34 : 27}
                          fill="white"
                          stroke={trainFill[train.status]}
                          strokeWidth="4"
                        />
                        <circle
                          cx={train.x}
                          cy={train.y}
                          r={isSelected ? 22 : 18}
                          fill={trainFill[train.status]}
                        />
                        <rect
                          x={train.x - 8}
                          y={train.y - 10}
                          width="16"
                          height="18"
                          rx="4"
                          fill="white"
                        />
                        <circle cx={train.x - 4} cy={train.y - 3} r="1.8" fill={trainFill[train.status]} />
                        <circle cx={train.x + 4} cy={train.y - 3} r="1.8" fill={trainFill[train.status]} />
                        <path
                          d={`M${train.x - 5} ${train.y + 5}H${train.x + 5}M${train.x - 4} ${train.y + 10}L${train.x - 8} ${train.y + 14}M${train.x + 4} ${train.y + 10}L${train.x + 8} ${train.y + 14}`}
                          fill="none"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        {(isSelected || displayTrains.length <= 2) ? (
                          <foreignObject
                            x={train.x - 68}
                            y={train.y - 62}
                            width="136"
                            height="36"
                            pointerEvents="none"
                          >
                            <div className="truncate rounded-full border border-white bg-white/95 px-3 py-1.5 text-center text-[11px] font-black leading-4 text-sky-800 shadow-md">
                              Đang tới {train.nextStation}
                            </div>
                          </foreignObject>
                        ) : null}
                      </g>
                    );
                  })}
                </svg>

                {!isLoadingLive && !liveError && !hasOperationalData ? (
                  <div className="absolute inset-0 z-20 flex items-center justify-center p-6">
                    <div className="max-w-sm rounded-2xl border border-slate-200 bg-white/92 px-6 py-5 text-center text-sm text-slate-600 shadow-xl backdrop-blur">
                      <Radio className="mx-auto mb-2 h-6 w-6 text-sky-300" />
                      Chưa có dữ liệu live từ hệ thống vận hành. Màn hình đang
                      hiển thị sơ đồ tuyến mẫu.
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
                  <div className="flex items-center gap-2">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                      <Radio className="h-5 w-5" />
                    </span>
                    <div>
                      <h2 className="text-lg font-black text-slate-950">
                        Đoàn tàu trên tuyến
                      </h2>
                      <p className="mt-0.5 text-xs font-semibold text-slate-500">
                        {resolvedRouteName}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                    {displayTrains.length} tàu
                  </span>
                </div>

                <div className="space-y-3">
                  {displayTrains.length === 0 ? (
                    <div className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                      Chưa có đoàn tàu đang hiển thị trên tuyến.
                    </div>
                  ) : (
                    displayTrains.slice(0, 5).map((train) => (
                      <button
                        key={train.id}
                        type="button"
                        onClick={() => setSelectedTrainId(train.id)}
                        className={`w-full rounded-2xl border p-3 text-left transition ${
                          selectedTrain.id === train.id
                            ? "border-sky-200 bg-sky-50 shadow-sm"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white"
                            style={{ backgroundColor: trainFill[train.status] }}
                          >
                            <TrainFront className="h-5 w-5" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center justify-between gap-3">
                              <span className="truncate text-sm font-black text-slate-950">
                                {train.code}
                              </span>
                              <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black ring-1 ${statusClass[train.status]}`}>
                                {statusLabel[train.status]}
                              </span>
                            </span>
                            <span className="mt-1 block truncate text-xs font-semibold text-slate-500">
                              {train.previousStation
                                ? `${train.previousStation} → ${train.nextStation}`
                                : `Đang tới ${train.nextStation}`}
                            </span>
                            <span className="mt-2 flex items-center justify-between gap-3 text-xs font-bold">
                              <span className="text-sky-700">
                                ETA {train.arrivalClock ? `${train.eta} · ${train.arrivalClock}` : train.eta}
                              </span>
                              <span className="text-slate-500">
                                {train.occupancy}% tải
                              </span>
                            </span>
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Tàu được chọn
                    </p>
                    <h2 className="text-2xl font-black text-slate-950">
                      {selectedTrain.code}
                    </h2>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${statusClass[selectedTrain.status]}`}
                  >
                    {statusLabel[selectedTrain.status]}
                  </span>
                </div>

                <div className="space-y-3">
                  {selectedTrain.previousStation ? (
                    <div className="rounded-2xl bg-sky-50 p-4 ring-1 ring-sky-100">
                      <p className="text-xs font-bold uppercase tracking-wide text-sky-700">
                        Trạng thái theo lịch
                      </p>
                      <p className="mt-1 text-sm font-black text-slate-950">
                        {selectedTrain.previousStation} → đang tới {selectedTrain.nextStation}
                      </p>
                      {selectedTrain.arrivalClock ? (
                        <p className="mt-1 text-xs font-semibold text-sky-700">
                          Dự kiến đến lúc {selectedTrain.arrivalClock}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Hướng đi
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-950">
                      {selectedTrain.direction}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Đang tới
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-950">
                        {selectedTrain.nextStation}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-sky-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-sky-700">
                        ETA
                      </p>
                      <p className="mt-1 text-sm font-black text-sky-700">
                        {selectedTrain.arrivalClock
                          ? `${selectedTrain.eta} · ${selectedTrain.arrivalClock}`
                          : selectedTrain.eta}
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
                  <h2 className="text-lg font-black text-slate-950">
                    Ga được chọn
                  </h2>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-black text-slate-950">
                        {selectedStation.name}
                      </p>
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

            </aside>
          </div>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                  <Clock3 className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-lg font-black text-slate-950">
                    Lịch sắp đến
                  </h2>
                  <p className="mt-0.5 text-xs font-semibold text-slate-500">
                    {isStationSchedulePinned
                      ? selectedStation.name
                      : "Toàn tuyến realtime"}
                  </p>
                </div>
              </div>
              {isLoadingSchedule ? (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                  Đang tải
                </span>
              ) : null}
            </div>

            {upcomingSchedules.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                Chưa có lịch trình cho ga hoặc tuyến đang chọn.
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {upcomingSchedules.map((schedule) => (
                  <button
                    key={schedule.id}
                    type="button"
                    onClick={() => {
                      if (schedule.stationId) selectStation(schedule.stationId);
                    }}
                    className="rounded-2xl border border-slate-200 bg-white p-3 text-left transition hover:border-sky-200 hover:bg-sky-50"
                  >
                    <span className="flex items-start gap-3">
                      <span
                        className={`flex h-12 w-16 shrink-0 flex-col items-center justify-center rounded-2xl text-white ${
                          schedule.source === "live" ? "bg-sky-600" : "bg-blue-700"
                        }`}
                      >
                        <span className="text-sm font-black leading-4">
                          {schedule.source === "live"
                            ? formatCompactMinutesUntil(schedule.minutesUntil)
                            : formatClock(schedule.departureTime)}
                        </span>
                        <span className="mt-0.5 text-[10px] font-bold uppercase leading-3 opacity-80">
                          {schedule.source === "live" ? "ETA" : "Giờ đi"}
                        </span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-black text-slate-950">
                          {schedule.stationName}
                        </span>
                        <span className="mt-1 block truncate text-xs font-semibold text-slate-500">
                          {schedule.source === "live" && schedule.trainCode
                            ? schedule.trainCode
                            : schedule.routeName}
                        </span>
                        <span className="mt-2 flex items-center justify-between gap-2 text-xs font-semibold text-slate-500">
                          <span className="inline-flex min-w-0 items-center gap-1.5 truncate">
                            <ArrowRight className="h-3 w-3 shrink-0 text-slate-400" />
                            <span className="truncate">{getScheduleStatus(schedule.status)}</span>
                          </span>
                          <span className="shrink-0 rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-black text-sky-700">
                            {formatMinutesUntil(schedule.minutesUntil)}
                          </span>
                        </span>
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid gap-3 md:grid-cols-[13rem_1fr]">
              <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3">
                <Activity className="h-5 w-5 text-sky-600" />
                <div>
                  <h2 className="text-sm font-black text-slate-950">
                    Tình hình vận hành
                  </h2>
                  <p className="text-xs font-semibold text-slate-500">
                    Tóm tắt hiện tại
                  </p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  {
                    icon: Gauge,
                    label: "Mật độ",
                    value: `${averageOccupancy}%`,
                    tone: "text-violet-700 bg-violet-50",
                  },
                  {
                    icon: AlertTriangle,
                    label: "Tàu chú ý",
                    value: delayedTrains,
                    tone: delayedTrains > 0
                      ? "text-rose-700 bg-rose-50"
                      : "text-emerald-700 bg-emerald-50",
                  },
                  {
                    icon: Wrench,
                    label: "Ga bảo trì",
                    value: allDisplayStations.filter(
                      (station) => station.status === "maintenance",
                    ).length,
                    tone: "text-slate-700 bg-slate-50",
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.tone}`}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="truncate text-sm font-bold text-slate-600">
                          {item.label}
                        </span>
                      </div>
                      <span className="text-lg font-black text-slate-950">
                        {item.value}
                      </span>
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
