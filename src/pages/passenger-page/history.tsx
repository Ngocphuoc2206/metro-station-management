import Head from "next/head";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  Search,
  X,
} from "lucide-react";
import PassengerShell from "@components/templates/PassengerShell";
import { publicApi } from "@features/public/publicApi";
import type { StationDto } from "@features/public/publicTypes";
import { tripApi, tripErrorMessage } from "@features/trip/tripApi";
import type { TripDto, TripPage } from "@features/trip/tripTypes";

const LIMIT = 10;

type TimeFilterKey = "today" | "3d" | "7d" | "1m" | "all";

const TIME_FILTERS: Array<{ key: TimeFilterKey; label: string; days?: number }> = [
  { key: "today", label: "Hôm nay", days: 0 },
  { key: "3d", label: "3 ngày gần đây", days: 3 },
  { key: "7d", label: "7 ngày gần đây", days: 7 },
  { key: "1m", label: "1 tháng", days: 30 },
  { key: "all", label: "Tất cả" },
];

const toInputDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toStartDateTime = (value?: string) =>
  value ? new Date(`${value}T00:00:00`).toISOString() : undefined;

const toEndDateTime = (value?: string) =>
  value ? new Date(`${value}T23:59:59.999`).toISOString() : undefined;

const getDateRange = (filter: TimeFilterKey) => {
  const option = TIME_FILTERS.find((item) => item.key === filter);
  if (!option || option.key === "all") return {};

  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (option.days ?? 0));

  return {
    from: toInputDate(start),
    to: toInputDate(end),
  };
};

const formatDate = (value?: string) => {
  if (!value) return "--";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("vi-VN");
};

const formatDateTime = (value?: string) => {
  if (!value) return "--";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("vi-VN");
};

const formatFare = (value?: number) =>
  value === undefined ? "--" : `${value.toLocaleString("vi-VN")} đ`;

export default function PassengerHistoryPage() {
  const [stations, setStations] = useState<StationDto[]>([]);
  const [timeFilter, setTimeFilter] = useState<TimeFilterKey>("today");
  const [isTimeFilterOpen, setIsTimeFilterOpen] = useState(false);
  const [isStationFilterOpen, setIsStationFilterOpen] = useState(false);
  const [stationId, setStationId] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [result, setResult] = useState<TripPage>({
    items: [],
    page: 0,
    limit: LIMIT,
    total: 0,
    totalPages: 1,
  });
  const [selected, setSelected] = useState<TripDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    publicApi.getStations().then(setStations).catch(() => {
      // Trip history still works when station option labels cannot be loaded.
    });
  }, []);

  const loadTrips = useCallback(async (active: { current: boolean }) => {
    setLoading(true);
    setError(null);
    try {
      const range = getDateRange(timeFilter);
      const data = await tripApi.list({
        page,
        limit: LIMIT,
        from: toStartDateTime(range.from),
        to: toEndDateTime(range.to),
        stationId: stationId || undefined,
      });
      if (active.current) setResult(data);
    } catch (requestError) {
      if (active.current) setError(tripErrorMessage(requestError));
    } finally {
      if (active.current) setLoading(false);
    }
  }, [page, stationId, timeFilter]);

  useEffect(() => {
    const active = { current: true };
    void loadTrips(active);
    return () => {
      active.current = false;
    };
  }, [loadTrips]);

  const selectedStationName = useMemo(() => {
    return (
      stations.find((station) => station.id === stationId)?.name ?? "Tất cả ga"
    );
  }, [stationId, stations]);

  const visibleTrips = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return result.items;

    return result.items.filter((trip) =>
      [
        trip.ticketCode,
        trip.ticketId,
        trip.originStationName,
        trip.destinationStationName,
        trip.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    );
  }, [query, result.items]);

  const showing = useMemo(() => {
    if (!result.total) return "Không có chuyến đi";
    const start = result.page * result.limit + 1;
    const end = Math.min(start + result.items.length - 1, result.total);
    return `Hiển thị ${start} - ${end} của ${result.total} chuyến đi`;
  }, [result]);

  const selectTimeFilter = (key: TimeFilterKey) => {
    setTimeFilter(key);
    setPage(0);
    setIsTimeFilterOpen(false);
  };

  const selectStationFilter = (nextStationId: string) => {
    setStationId(nextStationId);
    setPage(0);
    setIsStationFilterOpen(false);
  };

  return (
    <>
      <Head>
        <title>Lịch sử chuyến | MetroNext</title>
      </Head>

      <PassengerShell>
        <div className="mx-auto w-full max-w-7xl space-y-6">
          <div>
            <p className="text-sm text-slate-500">
              Hành khách / Lịch sử chuyến
            </p>
            <h1 className="mt-1 text-3xl font-black leading-tight text-slate-900 sm:text-4xl">
              Lịch sử chuyến
            </h1>
          </div>

          {error ? (
            <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <section className="overflow-visible rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-4 py-4">
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_13rem_3rem_9rem] lg:items-center">
                <div className="relative min-w-0">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Tìm mã vé, ga, trạng thái"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div className="relative w-full">
                  <button
                    type="button"
                    onClick={() => setIsStationFilterOpen((current) => !current)}
                    className="flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-left text-sm text-slate-900 transition hover:bg-white"
                    aria-expanded={isStationFilterOpen}
                  >
                    <span className="truncate">{selectedStationName}</span>
                    <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                  </button>

                  {isStationFilterOpen ? (
                    <div className="absolute right-0 top-full z-30 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
                      <button
                        type="button"
                        onClick={() => selectStationFilter("")}
                        className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-blue-50"
                      >
                        Tất cả ga
                      </button>
                      {stations.map((station) => (
                        <button
                          key={station.id}
                          type="button"
                          onClick={() => selectStationFilter(station.id)}
                          className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-blue-50"
                        >
                          {station.name}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsTimeFilterOpen((current) => !current)}
                    className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-white sm:w-10"
                    aria-label="Bộ lọc lịch sử chuyến"
                    aria-expanded={isTimeFilterOpen}
                  >
                    <Filter className="h-4 w-4" />
                  </button>

                  {isTimeFilterOpen ? (
                    <div className="absolute right-0 top-full z-30 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                      <p className="px-3 pb-2 pt-1 text-xs font-bold uppercase text-slate-500">
                        Khoảng thời gian
                      </p>
                      {TIME_FILTERS.map((option) => {
                        const isActive = option.key === timeFilter;
                        return (
                          <button
                            key={option.key}
                            type="button"
                            onClick={() => selectTimeFilter(option.key)}
                            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                              isActive
                                ? "bg-blue-50 font-bold text-blue-700"
                                : "text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {option.label}
                            {isActive ? <Check className="h-4 w-4" /> : null}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>

                <button type="button" className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm shadow-blue-600/20">
                  <Search className="h-4 w-4" />
                  Tìm kiếm
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-2 p-12 text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin" />
                Đang tải lịch sử chuyến
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[760px] w-full table-fixed text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="p-4">Ngày</th>
                      <th className="p-4">Ga vào</th>
                      <th className="p-4">Ga ra</th>
                      <th className="p-4">Giá vé</th>
                      <th className="p-4">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleTrips.map((trip) => (
                      <tr
                        key={trip.id}
                        onClick={() => setSelected(trip)}
                        className="cursor-pointer border-t border-slate-100 hover:bg-blue-50"
                      >
                        <td className="p-4">{formatDate(trip.checkInAt)}</td>
                        <td className="p-4">
                          <p className="font-semibold">
                            {trip.originStationName || "--"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatDateTime(trip.checkInAt)}
                          </p>
                        </td>
                        <td className="p-4">
                          <p className="font-semibold">
                            {trip.destinationStationName || "--"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatDateTime(trip.checkOutAt)}
                          </p>
                        </td>
                        <td className="p-4 font-semibold text-slate-900">
                          {formatFare(trip.fare)}
                        </td>
                        <td className="p-4">{trip.status || "--"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!visibleTrips.length ? (
                  <p className="p-10 text-center text-sm text-slate-500">
                    Không tìm thấy chuyến đi.
                  </p>
                ) : null}
              </div>
            )}
          </section>

          <div className="flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>{showing}</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((current) => Math.max(0, current - 1))}
                className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="font-semibold text-slate-900">
                Trang {page + 1} / {result.totalPages}
              </span>
              <button
                type="button"
                disabled={page + 1 >= result.totalPages}
                onClick={() => setPage((current) => current + 1)}
                className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </PassengerShell>

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <aside className="w-full max-w-md overflow-hidden rounded-3xl bg-white p-4 shadow-2xl sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Chi tiết chuyến đi</h2>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-xl p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Đóng chi tiết chuyến đi"
              >
                <X />
              </button>
            </div>
            <div className="mt-8 space-y-4 rounded-2xl bg-slate-50 p-5 text-sm">
              <p>
                <span className="text-slate-500">Mã vé:</span>{" "}
                <strong>
                  {selected.ticketCode || selected.ticketId || "--"}
                </strong>
              </p>
              <p>
                <span className="text-slate-500">Ga vào:</span>{" "}
                {selected.originStationName || "--"}
              </p>
              <p>
                <span className="text-slate-500">Thời gian vào:</span>{" "}
                {formatDateTime(selected.checkInAt)}
              </p>
              <p>
                <span className="text-slate-500">Ga ra:</span>{" "}
                {selected.destinationStationName || "--"}
              </p>
              <p>
                <span className="text-slate-500">Thời gian ra:</span>{" "}
                {formatDateTime(selected.checkOutAt)}
              </p>
              <p>
                <span className="text-slate-500">Tổng tiền:</span>{" "}
                <strong>{formatFare(selected.fare)}</strong>
              </p>
              <p>
                <span className="text-slate-500">Trạng thái:</span>{" "}
                {selected.status || "--"}
              </p>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
