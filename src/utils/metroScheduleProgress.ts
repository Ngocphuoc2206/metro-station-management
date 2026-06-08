export type TrainStatus = "on-time" | "delayed" | "arriving";

export type ScheduleLike = {
  id: string;
  routeId: string;
  stationId: string;
  direction: string;
  departureTime: string;
  arrivalTime: string;
  frequencyMinutes: number;
  status: string;
};

export type StationPoint = {
  id: string;
  name: string;
  x: number;
  y: number;
};

export type ScheduleLine<TSchedule extends ScheduleLike = ScheduleLike> = {
  key: string;
  routeId: string;
  direction: string;
  stops: TSchedule[];
  offsets: number[];
  frequencySeconds: number;
  originSeconds: number;
};

export type ApproachingTrainPosition = {
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

export type ScheduledPosition = {
  x: number;
  y: number;
  previousStationId?: string;
  previousStationName?: string;
  nextStationId?: string;
  nextStationName: string;
  eta: string;
  arrivalClock?: string;
  etaSeconds: number;
  status: TrainStatus;
};

export const etaMinutes = (eta: string) => {
  if (eta.toLowerCase().includes("sắp")) return 0;
  const match = eta.match(/(\d+)/);
  return match ? Number(match[1]) : null;
};

export const parseTimeToSeconds = (value?: string) => {
  const match = value?.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!match) return null;

  const total =
    Number(match[1]) * 3600 +
    Number(match[2]) * 60 +
    Number(match[3] ?? 0);

  return Number.isFinite(total) ? total : null;
};

export const getScheduleSeconds = (schedule: ScheduleLike) =>
  parseTimeToSeconds(schedule.arrivalTime || schedule.departureTime);

export const getNowSeconds = (now: Date) =>
  now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

export const getForwardOffsetSeconds = (fromSeconds: number, toSeconds: number) =>
  toSeconds >= fromSeconds ? toSeconds - fromSeconds : toSeconds + 86400 - fromSeconds;

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const lerp = (start: number, end: number, progress: number) =>
  start + (end - start) * progress;

export const normalizeDirection = (value?: string) =>
  (value ?? "").trim().toUpperCase();

export const lineKey = (schedule: ScheduleLike) =>
  `${schedule.routeId}::${normalizeDirection(schedule.direction)}`;

export const formatEtaSeconds = (seconds: number) => {
  if (seconds <= 60) return "Sắp đến";
  return `${Math.ceil(seconds / 60)} phút`;
};

export const formatSecondsAsClock = (totalSeconds: number) => {
  const normalized = ((totalSeconds % 86400) + 86400) % 86400;
  const hours = Math.floor(normalized / 3600);
  const minutes = Math.floor((normalized % 3600) / 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

const formatClock = (value: string) => {
  const match = value?.match(/(\d{1,2}):(\d{2})/);
  return match ? `${match[1].padStart(2, "0")}:${match[2]}` : value || "--:--";
};

export const buildScheduleLines = <TSchedule extends ScheduleLike>(
  schedules: TSchedule[],
  routeStationOrder: ReadonlyMap<string, ReadonlyMap<string, number>>,
): ScheduleLine<TSchedule>[] => {
  const groupedSchedules = new Map<string, TSchedule[]>();

  schedules.forEach((schedule) => {
    const key = lineKey(schedule);
    groupedSchedules.set(key, [...(groupedSchedules.get(key) ?? []), schedule]);
  });

  return Array.from(groupedSchedules.entries())
    .map(([key, items]) => {
      const direction = normalizeDirection(items[0]?.direction);
      const isInbound =
        direction.includes("INBOUND") ||
        direction.includes("RETURN") ||
        direction.includes("VỀ") ||
        direction.includes("VE");
      const sortedStops = [...items].sort((a, b) => {
        const routeOrder = routeStationOrder.get(a.routeId);
        const aSeconds = getScheduleSeconds(a);
        const bSeconds = getScheduleSeconds(b);
        if (aSeconds !== null && bSeconds !== null && aSeconds !== bSeconds) {
          return aSeconds - bSeconds;
        }
        const sequenceDiff =
          (routeOrder?.get(a.stationId) ?? Number.MAX_SAFE_INTEGER) -
          (routeOrder?.get(b.stationId) ?? Number.MAX_SAFE_INTEGER);
        return isInbound ? -sequenceDiff : sequenceDiff;
      });

      const originSeconds = getScheduleSeconds(sortedStops[0]);
      if (originSeconds === null) return null;

      const offsets = sortedStops.map((schedule) => {
        const stopSeconds = getScheduleSeconds(schedule);
        return stopSeconds === null
          ? 0
          : getForwardOffsetSeconds(originSeconds, stopSeconds);
      });

      return {
        key,
        routeId: sortedStops[0].routeId,
        direction: sortedStops[0].direction,
        stops: sortedStops,
        offsets,
        frequencySeconds:
          Math.max(1, Number(sortedStops[0].frequencyMinutes || 0)) * 60,
        originSeconds,
      };
    })
    .filter(Boolean) as ScheduleLine<TSchedule>[];
};

export const resolveApproachingTrainOnLine = <TSchedule extends ScheduleLike>(
  line: ScheduleLine<TSchedule>,
  nowSeconds: number,
  stationById: ReadonlyMap<string, StationPoint>,
  trainIndex: number,
): ApproachingTrainPosition | null => {
  const elapsedFromOrigin = getForwardOffsetSeconds(line.originSeconds, nowSeconds);
  const timelineNow = line.originSeconds + elapsedFromOrigin;
  const upcomingStops = line.stops
    .map((stop, index) => {
      const baseArrivalSeconds = line.originSeconds + line.offsets[index];
      const cycles = Math.max(
        0,
        Math.ceil((timelineNow - baseArrivalSeconds) / line.frequencySeconds),
      );

      return {
        index,
        stop,
        arrivalSeconds: baseArrivalSeconds + cycles * line.frequencySeconds,
      };
    })
    .filter((item) => item.arrivalSeconds >= timelineNow)
    .sort((a, b) => a.arrivalSeconds - b.arrivalSeconds);

  const target = upcomingStops.find((item) => item.index > 0) ?? upcomingStops[0];
  if (!target) return null;

  const nextIndex = target.index;
  const nextStop = target.stop;
  const nextStation = stationById.get(nextStop.stationId);
  if (!nextStation) return null;

  const previousIndex = Math.max(0, nextIndex - 1);
  const previousStation =
    nextIndex > 0 ? stationById.get(line.stops[previousIndex].stationId) : null;
  const tripStartSeconds = target.arrivalSeconds - line.offsets[nextIndex];
  const previousEventSeconds =
    previousStation && nextIndex > 0
      ? tripStartSeconds + line.offsets[previousIndex]
      : target.arrivalSeconds;
  const nextArrivalSeconds = target.arrivalSeconds;
  const etaSeconds = Math.max(0, nextArrivalSeconds - timelineNow);
  const segmentDuration =
    nextIndex > 0
      ? Math.max(1, nextArrivalSeconds - previousEventSeconds)
      : line.frequencySeconds;
  const progress =
    previousStation && nextIndex > 0
      ? clamp((timelineNow - previousEventSeconds) / segmentDuration, 0, 0.92)
      : 0;

  const hasDelay = nextStop.status.toUpperCase().includes("DELAY");

  return {
    id: `schedule-${line.key}-${nextStop.id}-${nextArrivalSeconds}`,
    code: `Metro ${String(trainIndex + 1).padStart(2, "0")}`,
    direction: line.direction || "--",
    previousStationId: previousStation ? line.stops[previousIndex].stationId : undefined,
    previousStation: previousStation?.name,
    nextStationId: nextStop.stationId,
    nextStation: nextStation.name,
    eta: formatEtaSeconds(etaSeconds),
    arrivalClock: formatSecondsAsClock(nextArrivalSeconds),
    occupancy: 0,
    status: hasDelay ? "delayed" : etaSeconds <= 120 ? "arriving" : "on-time",
    x: previousStation ? lerp(previousStation.x, nextStation.x, progress) : nextStation.x,
    y: previousStation ? lerp(previousStation.y, nextStation.y, progress) : nextStation.y,
    routeId: line.routeId,
  };
};

export const resolvePositionFromNextStation = <TSchedule extends ScheduleLike>(
  line: ScheduleLine<TSchedule>,
  nextStationId: string | undefined,
  nextStationName: string,
  etaText: string,
  stationById: ReadonlyMap<string, StationPoint>,
  nowSeconds?: number,
): ScheduledPosition | null => {
  const normalizedNextStationName = nextStationName.trim().toLowerCase();
  const nextIndex = line.stops.findIndex((stop) => {
    const station = stationById.get(stop.stationId);
    return (
      (!!nextStationId && stop.stationId === nextStationId) ||
      (!!normalizedNextStationName &&
        station?.name.trim().toLowerCase() === normalizedNextStationName)
    );
  });

  if (nextIndex === -1) return null;

  const nextStop = line.stops[nextIndex];
  const nextStation = stationById.get(nextStop.stationId);
  if (!nextStation) return null;

  const previousIndex = Math.max(0, nextIndex - 1);
  const previousStation =
    nextIndex > 0 ? stationById.get(line.stops[previousIndex].stationId) : null;
  const segmentDuration =
    nextIndex > 0
      ? Math.max(60, line.offsets[nextIndex] - line.offsets[previousIndex])
      : line.frequencySeconds;
  const scheduleArrival =
    nowSeconds === undefined
      ? null
      : (() => {
          const elapsedFromOrigin = getForwardOffsetSeconds(
            line.originSeconds,
            nowSeconds,
          );
          const timelineNow = line.originSeconds + elapsedFromOrigin;
          const baseArrivalSeconds = line.originSeconds + line.offsets[nextIndex];
          const cycles = Math.max(
            0,
            Math.ceil((timelineNow - baseArrivalSeconds) / line.frequencySeconds),
          );
          const arrivalSeconds =
            baseArrivalSeconds + cycles * line.frequencySeconds;

          return {
            arrivalSeconds,
            etaSeconds: Math.max(0, arrivalSeconds - timelineNow),
          };
        })();
  const parsedEtaMinutes = etaMinutes(etaText);
  const etaSeconds =
    parsedEtaMinutes === null
      ? (scheduleArrival?.etaSeconds ?? 0)
      : parsedEtaMinutes * 60;
  const progress =
    previousStation && etaSeconds > 0
      ? clamp(1 - etaSeconds / segmentDuration, 0.06, 0.98)
      : previousStation
        ? 0.82
        : 0;
  const hasDelay = nextStop.status.toUpperCase().includes("DELAY");

  return {
    x: previousStation ? lerp(previousStation.x, nextStation.x, progress) : nextStation.x,
    y: previousStation ? lerp(previousStation.y, nextStation.y, progress) : nextStation.y,
    previousStationId: previousStation ? line.stops[previousIndex].stationId : undefined,
    previousStationName: previousStation?.name,
    nextStationId: nextStop.stationId,
    nextStationName: nextStation.name,
    eta: etaText || formatEtaSeconds(etaSeconds),
    arrivalClock: scheduleArrival
      ? formatSecondsAsClock(scheduleArrival.arrivalSeconds)
      : nextStop.arrivalTime
        ? formatClock(nextStop.arrivalTime)
        : undefined,
    etaSeconds,
    status: hasDelay ? "delayed" : etaSeconds > 0 && etaSeconds <= 120 ? "arriving" : "on-time",
  };
};
