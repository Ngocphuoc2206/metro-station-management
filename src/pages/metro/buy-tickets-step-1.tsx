import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import PassengerShell from "@components/templates/PassengerShell";
import { publicApi } from "@features/public/publicApi";
import type { StationDto } from "@features/public/publicTypes";
import { calculateDistanceKm } from "@utils/geo";
import {
  ArrowRight,
  CalendarDays,
  ChevronDown,
  CreditCard,
  MapPin,
  User,
} from "lucide-react";

const PASSENGER_OPTIONS = [
  "1 người lớn",
  "2 người lớn",
  "3 người lớn",
  "1 người lớn + 1 trẻ em",
  "2 người lớn + 1 trẻ em",
];

const STORAGE_KEY = "metro-buy-ticket-step1";

type Step1StorageState = {
  originStationId?: string;
  destinationStationId?: string;
  travelDate?: string;
  passengerCount?: string;
  isRoundTrip?: boolean;
};

const getTodayInputDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDate = (value: string) => {
  const [year, month, day] = value.split("-");

  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
};

const MetroBuyTicketsStep1Page: NextPage = () => {
  const router = useRouter();
  const [stations, setStations] = useState<StationDto[]>([]);
  const [isLoadingStations, setIsLoadingStations] = useState(true);
  const [stationsError, setStationsError] = useState<string | null>(null);
  const [originStationId, setOriginStationId] = useState("");
  const [destinationStationId, setDestinationStationId] = useState("");
  const [travelDate, setTravelDate] = useState(getTodayInputDate);
  const [passengerCount, setPassengerCount] = useState(PASSENGER_OPTIONS[0]);
  const [isRoundTrip, setIsRoundTrip] = useState(false);

  const stationsById = useMemo(() => {
    return new Map(stations.map((s) => [s.id, s]));
  }, [stations]);

  const routeDistanceKm = useMemo(() => {
    return calculateDistanceKm(
      stationsById.get(originStationId),
      stationsById.get(destinationStationId),
    );
  }, [destinationStationId, originStationId, stationsById]);

  useEffect(() => {
    let cancelled = false;

    const loadStations = async () => {
      setIsLoadingStations(true);
      setStationsError(null);
      try {
        const data = await publicApi.getStations();
        if (!cancelled) setStations(data);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Không thể tải danh sách ga";
        if (!cancelled) setStationsError(message);
      } finally {
        if (!cancelled) setIsLoadingStations(false);
      }
    };

    loadStations();

    return () => {
      cancelled = true;
    };
  }, []);

  const destinationOptions = useMemo(() => {
    return stations.filter((station) => station.id !== originStationId);
  }, [originStationId, stations]);

  const originOptions = useMemo(() => {
    return stations.filter((station) => station.id !== destinationStationId);
  }, [destinationStationId, stations]);

  useEffect(() => {
    if (!router.isReady) return;

    const stored = (() => {
      if (typeof window === "undefined") return null;
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return null;

      try {
        return JSON.parse(raw) as Step1StorageState;
      } catch {
        return null;
      }
    })();

    const fromQuery =
      typeof router.query.from === "string" ? router.query.from : undefined;
    const toQuery =
      typeof router.query.to === "string" ? router.query.to : undefined;
    const dateQuery =
      typeof router.query.date === "string" ? router.query.date : undefined;
    const passengersQuery =
      typeof router.query.passengers === "string"
        ? router.query.passengers
        : undefined;
    const hasRoundTripQuery = typeof router.query.roundTrip === "string";

    setOriginStationId(fromQuery ?? stored?.originStationId ?? "");
    setDestinationStationId(toQuery ?? stored?.destinationStationId ?? "");
    setTravelDate(dateQuery ?? stored?.travelDate ?? getTodayInputDate());
    setPassengerCount(
      passengersQuery ?? stored?.passengerCount ?? PASSENGER_OPTIONS[0],
    );
    setIsRoundTrip(
      hasRoundTripQuery ? router.query.roundTrip === "1" : Boolean(stored?.isRoundTrip),
    );
  }, [router.isReady, router.query]);

  const isFormReady =
    originStationId.length > 0 &&
    destinationStationId.length > 0 &&
    originStationId !== destinationStationId &&
    routeDistanceKm !== undefined &&
    travelDate.length > 0 &&
    passengerCount.length > 0;

  const handleOriginChange = (value: string) => {
    setOriginStationId(value);
    if (value && value === destinationStationId) {
      setDestinationStationId("");
    }
  };

  const handleDestinationChange = (value: string) => {
    setDestinationStationId(value);
    if (value && value === originStationId) {
      setOriginStationId("");
    }
  };

  const handleContinue = async () => {
    if (!isFormReady) {
      return;
    }

    const payload = {
      originStationId,
      originStationName:
        stationsById.get(originStationId)?.name ?? originStationId,
      destinationStationId,
      destinationStationName:
        stationsById.get(destinationStationId)?.name ?? destinationStationId,
      distance: routeDistanceKm,
      travelDate,
      passengerCount,
      isRoundTrip,
    };

    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    }

    await router.push({
      pathname: "/passenger-page/buy-tickets-step-2",
      query: {
        from: originStationId,
        to: destinationStationId,
        date: travelDate,
        passengers: passengerCount,
        roundTrip: isRoundTrip ? "1" : "0",
        distance: routeDistanceKm?.toString() ?? "",
      },
    });
  };

  return (
    <PassengerShell>
      <div className="mx-auto w-full max-w-[1200px]">
        <section className="flex min-w-0 flex-col gap-6">
          <div className="flex flex-col gap-4">
            <h1 className="text-3xl leading-tight font-black text-neutral-900 sm:text-4xl sm:leading-10">
              Mua vé
            </h1>

            <div className="flex items-start gap-4 overflow-x-auto border-b border-slate-300 text-sm font-bold tracking-tight sm:gap-8">
              <div className="border-b-[3px] border-blue-600 pb-3 pt-4 text-blue-600">
                1. Hành trình
              </div>
              <div className="border-b-[3px] border-transparent pb-3 pt-4 text-slate-500">
                2. Loại vé
              </div>
              <div className="border-b-[3px] border-transparent pb-3 pt-4 text-slate-500">
                3. Thanh toán
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="flex min-w-0 flex-col gap-6">
              <article className="flex flex-col gap-6 rounded-xl bg-white px-4 py-5 shadow-[0px_1px_2px_rgba(0,0,0,0.05)] outline outline-1 outline-slate-200 sm:px-6 sm:py-6">
                <h2 className="text-xl leading-7 font-bold text-neutral-900">
                  Thông tin hành trình
                </h2>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-semibold text-neutral-900">
                      Ga đi
                    </span>
                    <div className="relative">
                      <select
                        value={originStationId}
                        onChange={(event) =>
                          handleOriginChange(event.target.value)
                        }
                        disabled={isLoadingStations}
                        className="h-12 w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 pr-10 text-base text-neutral-900 outline-none focus:border-blue-600"
                      >
                        <option value="">Chọn ga đi</option>
                        {originOptions.map((station) => (
                          <option key={station.id} value={station.id}>
                            {station.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    </div>
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-semibold text-neutral-900">
                      Ga đến
                    </span>
                    <div className="relative">
                      <select
                        value={destinationStationId}
                        onChange={(event) =>
                          handleDestinationChange(event.target.value)
                        }
                        disabled={isLoadingStations}
                        className="h-12 w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 pr-10 text-base text-neutral-900 outline-none focus:border-blue-600"
                      >
                        <option value="">Chọn ga đến</option>
                        {destinationOptions.map((station) => (
                          <option key={station.id} value={station.id}>
                            {station.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    </div>
                    {originStationId &&
                    destinationStationId &&
                    originStationId === destinationStationId ? (
                      <span className="text-xs text-red-600">
                        Ga đi và ga đến không được trùng nhau
                      </span>
                    ) : null}
                  </label>

                  {stationsError ? (
                    <div className="sm:col-span-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 outline outline-1 outline-offset-[-1px] outline-red-100">
                      {stationsError}
                    </div>
                  ) : null}

                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-semibold text-neutral-900">
                      Số hành khách
                    </span>
                    <div className="relative">
                      <select
                        value={passengerCount}
                        onChange={(event) =>
                          setPassengerCount(event.target.value)
                        }
                        className="h-12 w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 pr-10 text-base text-neutral-900 outline-none focus:border-blue-600"
                      >
                        {PASSENGER_OPTIONS.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    </div>
                  </label>
                </div>

                <div className="flex flex-col gap-4 border-t border-slate-200 pt-6 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">
                      Khứ hồi
                    </p>
                    <p className="text-xs text-slate-500">
                      Chọn nếu bạn muốn đặt vé lượt về
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Chọn khứ hồi"
                    onClick={() => setIsRoundTrip((prev) => !prev)}
                    className={`relative h-6 w-11 rounded-full transition ${
                      isRoundTrip ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full border bg-white transition ${
                        isRoundTrip
                          ? "left-5.5 border-blue-600"
                          : "left-0.5 border-gray-300"
                      }`}
                    />
                  </button>
                </div>
              </article>

              <article className="relative h-48 overflow-hidden rounded-xl">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-400 opacity-90" />
                <div className="absolute -right-8 top-0 h-48 w-40 rounded-l-full bg-white/20" />
                <div className="absolute inset-0 flex flex-col justify-center px-5 text-white sm:px-8">
                  <h3 className="pb-2 text-xl leading-7 font-bold">
                    Trải nghiệm MetroNext 5 sao
                  </h3>
                  <p className="max-w-96 text-sm leading-5 opacity-90">
                    Tiết kiệm hơn 20% khi mua vé tháng trực tuyến. Nhanh chóng,
                    tiện lợi, an toàn.
                  </p>
                </div>
              </article>
            </div>

            <aside className="w-full">
              <article className="flex flex-col gap-4 rounded-xl bg-white p-4 shadow-[0px_1px_2px_rgba(0,0,0,0.05)] outline outline-1 outline-slate-200 sm:p-6">
                <h3 className="text-lg leading-7 font-bold text-neutral-900">
                  Tóm tắt đơn
                </h3>

                <div className="flex flex-col gap-4 pb-2">
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-xs font-bold tracking-wide text-slate-500 uppercase">
                        Ga đi - Ga đến
                      </p>
                      <p className="text-sm font-medium text-neutral-900">
                        {originStationId && destinationStationId
                          ? `${stationsById.get(originStationId)?.name ?? originStationId} - ${stationsById.get(destinationStationId)?.name ?? destinationStationId}`
                          : "Chưa chọn"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CalendarDays className="mt-0.5 h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-xs font-bold tracking-wide text-slate-500 uppercase">
                        Ngày đi
                      </p>
                      <p className="text-sm font-medium text-neutral-900">
                        {formatDate(travelDate)}
                      </p>
                    </div>
                  </div>
                  {originStationId &&
                  destinationStationId &&
                  routeDistanceKm !== undefined ? (
                    <div className="flex items-start gap-3">
                      <MapPin className="mt-0.5 h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-xs font-bold tracking-wide text-slate-500 uppercase">
                          Khoảng cách
                        </p>
                        <p className="text-sm font-medium text-neutral-900">
                          {routeDistanceKm.toLocaleString("vi-VN")} km
                        </p>
                      </div>
                    </div>
                  ) : null}
                  <div className="flex items-start gap-3">
                    <User className="mt-0.5 h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-xs font-bold tracking-wide text-slate-500 uppercase">
                        Hành khách
                      </p>
                      <p className="text-sm font-medium text-neutral-900">
                        {passengerCount}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={!isFormReady}
                  className={`relative inline-flex items-center justify-center gap-3 rounded-xl px-4 py-4 text-white shadow-[0px_4px_6px_-4px_rgba(19,127,236,0.2),0px_10px_15px_-3px_rgba(19,127,236,0.2)] transition ${
                    isFormReady
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "cursor-not-allowed bg-slate-300"
                  }`}
                >
                  <CreditCard className="h-4 w-4" />
                  <span className="text-center text-base leading-6 font-bold">
                    Tiếp tục chọn loại vé
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </article>
            </aside>
          </div>
        </section>
      </div>
    </PassengerShell>
  );
};

export default MetroBuyTicketsStep1Page;
