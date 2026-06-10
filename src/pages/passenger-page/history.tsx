import Head from "next/head";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
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
const VIETNAM_TIME_ZONE = "Asia/Ho_Chi_Minh";
const EXPLICIT_TIME_ZONE_PATTERN = /(?:Z|[+-]\d{2}:?\d{2})$/i;

type RangeKey = "3d" | "7d" | "1m" | "all";

const RANGE_OPTIONS: Array<{ key: RangeKey; label: string; caption: string }> = [
  { key: "3d", label: "3 ngày", caption: "3 ngày gần đây" },
  { key: "7d", label: "7 ngày", caption: "7 ngày gần đây" },
  { key: "1m", label: "1 tháng", caption: "1 tháng gần đây" },
  { key: "all", label: "Tất cả", caption: "tất cả chuyến" },
];

const toIsoDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getRangeDates = (range: RangeKey) => {
  if (range === "all") return { from: "", to: "" };

  const to = new Date();
  const from = new Date(to);
  if (range === "1m") {
    from.setMonth(from.getMonth() - 1);
  } else {
    from.setDate(from.getDate() - (range === "3d" ? 2 : 6));
  }

  return { from: toIsoDateInput(from), to: toIsoDateInput(to) };
};

const toStartDateTime = (value: string) =>
  value ? new Date(`${value}T00:00:00`).toISOString() : undefined;
const toEndDateTime = (value: string) =>
  value ? new Date(`${value}T23:59:59.999`).toISOString() : undefined;

const parseApiDate = (value: string) => {
  const trimmed = value.trim();
  const normalized =
    /\d{2}:\d{2}/.test(trimmed) && !EXPLICIT_TIME_ZONE_PATTERN.test(trimmed)
      ? `${trimmed.replace(" ", "T")}Z`
      : trimmed;
  return new Date(normalized);
};

const formatDate = (value?: string) => {
  if (!value) return "--";
  const date = parseApiDate(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("vi-VN", { timeZone: VIETNAM_TIME_ZONE });
};

const formatDateTime = (value?: string) => {
  if (!value) return "--";
  const date = parseApiDate(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("vi-VN", { timeZone: VIETNAM_TIME_ZONE });
};

const formatFare = (value?: number) =>
  value === undefined ? "--" : `${value.toLocaleString("vi-VN")} đ`;

const normalizeText = (value?: string | number) =>
  String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export default function PassengerHistoryPage() {
  const [stations, setStations] = useState<StationDto[]>([]);
  const [range, setRange] = useState<RangeKey>("3d");
  const [stationId, setStationId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    ...getRangeDates("3d"),
    range: "3d" as RangeKey,
    stationId: "",
  });
  const [showRangeMenu, setShowRangeMenu] = useState(false);
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
    publicApi
      .getStations()
      .then(setStations)
      .catch(() => {
        // Trip history still works when station option labels cannot be loaded.
      });
  }, []);

  const loadTrips = useCallback(
    async (active: { current: boolean }) => {
      setLoading(true);
      setError(null);
      try {
        const data = await tripApi.list({
          page,
          limit: LIMIT,
          from: toStartDateTime(filters.from),
          to: toEndDateTime(filters.to),
          stationId: filters.stationId || undefined,
        });
        if (active.current) setResult(data);
      } catch (requestError) {
        if (active.current) setError(tripErrorMessage(requestError));
      } finally {
        if (active.current) setLoading(false);
      }
    },
    [filters, page],
  );

  useEffect(() => {
    const active = { current: true };
    void loadTrips(active);
    return () => {
      active.current = false;
    };
  }, [loadTrips]);

  const selectRange = (nextRange: RangeKey) => {
    const dates = getRangeDates(nextRange);
    setRange(nextRange);
    setPage(0);
    setFilters({ ...dates, range: nextRange, stationId });
    setShowRangeMenu(false);
  };

  const applyStationFilter = (nextStationId: string) => {
    setStationId(nextStationId);
    setPage(0);
    setFilters((current) => ({ ...current, stationId: nextStationId }));
  };

  const rangeCaption =
    RANGE_OPTIONS.find((option) => option.key === filters.range)?.caption ??
    "3 ngày gần đây";

  const visibleItems = useMemo(() => {
    const query = normalizeText(searchTerm.trim());
    if (!query) return result.items;

    return result.items.filter((trip) =>
      [
        trip.ticketCode,
        trip.ticketId,
        trip.originStationName,
        trip.destinationStationName,
        trip.status,
        trip.fare,
      ].some((value) => normalizeText(value).includes(query)),
    );
  }, [result.items, searchTerm]);

  const showing = useMemo(() => {
    if (!result.total) return "Không có chuyến đi";
    const start = result.page * result.limit + 1;
    const end = Math.min(start + result.items.length - 1, result.total);
    return `Hiển thị ${start} - ${end} của ${result.total} chuyến đi`;
  }, [result]);

  return (
    <>
      <Head>
        <title>Lịch sử chuyến | MetroNext</title>
      </Head>
      <PassengerShell>
        <div className="mx-auto max-w-7xl">
          <section className="overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
            <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-xl font-bold text-slate-950">
                  Danh sách chuyến
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Hiển thị: {rangeCaption}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <label className="relative block sm:w-80 lg:w-96">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Tìm mã vé, ga, trạng thái"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                  />
                </label>

                <select
                  value={stationId}
                  onChange={(event) => applyStationFilter(event.target.value)}
                  className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50 sm:w-64"
                >
                  <option value="">Tất cả ga</option>
                  {stations.map((station) => (
                    <option key={station.id} value={station.id}>
                      {station.name}
                    </option>
                  ))}
                </select>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowRangeMenu((current) => !current)}
                    className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    aria-label="Lọc khoảng thời gian"
                    aria-expanded={showRangeMenu}
                  >
                    <Filter className="h-5 w-5" />
                  </button>

                  {showRangeMenu ? (
                    <div className="absolute right-0 z-20 mt-2 w-44 rounded-xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-200/80">
                      {RANGE_OPTIONS.map((option) => (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() => selectRange(option.key)}
                          className={`w-full rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${
                            range === option.key
                              ? "bg-blue-50 text-blue-700"
                              : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

              </div>
            </div>

            {error ? (
              <p className="m-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            {loading ? (
              <div className="flex items-center justify-center gap-2 p-12 text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin" />
                Đang tải lịch sử chuyến
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-5 py-4 font-bold">Ngày</th>
                      <th className="px-5 py-4 font-bold">Ga vào</th>
                      <th className="px-5 py-4 font-bold">Ga ra</th>
                      <th className="px-5 py-4 font-bold">Giá vé</th>
                      <th className="px-5 py-4 font-bold">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visibleItems.map((trip) => (
                      <tr
                        key={trip.id}
                        onClick={() => setSelected(trip)}
                        className="cursor-pointer transition hover:bg-blue-50/70"
                      >
                        <td className="whitespace-nowrap px-5 py-5 text-slate-900">
                          {formatDate(trip.checkInAt)}
                        </td>
                        <td className="min-w-56 px-5 py-5">
                          <p className="font-bold text-slate-950">
                            {trip.originStationName || "--"}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {formatDateTime(trip.checkInAt)}
                          </p>
                        </td>
                        <td className="min-w-56 px-5 py-5">
                          <p className="font-bold text-slate-950">
                            {trip.destinationStationName || "--"}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {formatDateTime(trip.checkOutAt)}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-5 py-5 font-bold text-slate-950">
                          {formatFare(trip.fare)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-5 text-slate-700">
                          {trip.status || "--"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!visibleItems.length ? (
                  <p className="p-10 text-center text-sm text-slate-500">
                    Không tìm thấy chuyến đi.
                  </p>
                ) : null}
              </div>
            )}
          </section>

          <div className="mt-4 flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>{searchTerm ? `${visibleItems.length} kết quả phù hợp` : showing}</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((current) => Math.max(0, current - 1))}
                className="rounded-lg border border-slate-200 bg-white p-2 disabled:opacity-40"
                aria-label="Trang trước"
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
                className="rounded-lg border border-slate-200 bg-white p-2 disabled:opacity-40"
                aria-label="Trang sau"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </PassengerShell>

      {selected ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40">
          <aside className="h-full w-full max-w-md bg-white p-6 shadow-xl">
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
