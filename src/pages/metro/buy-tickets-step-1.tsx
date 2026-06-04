import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import PassengerShell from "@components/templates/PassengerShell";
import { fareCalcApi } from "@features/fare/fareCalcApi";
import { publicApi } from "@features/public/publicApi";
import type { StationDto, TicketTypeDto } from "@features/public/publicTypes";
import { calculateDistanceKm } from "@utils/geo";
import {
  ArrowRight,
  CalendarDays,
  ChevronDown,
  CreditCard,
  MapPin,
  User,
} from "lucide-react";
import axios from "axios";

const PASSENGER_OPTIONS = [
  "1 người lớn",
  "2 người lớn",
  "3 người lớn",
  "1 người lớn + 1 trẻ em",
  "2 người lớn + 1 trẻ em",
];

const STORAGE_KEY = "metro-buy-ticket-step1";

const normalizedTicketTypeName = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const ticketTypePriority = (ticket: TicketTypeDto) => {
  const name = normalizedTicketTypeName(ticket.name);
  if (
    name.includes("daily") ||
    name.includes("day") ||
    name.includes("ve ngay")
  )
    return 0;
  if (name.includes("month") || name.includes("ve thang")) return 1;
  if (name.includes("single") || name.includes("ve luot")) return 2;
  return 3;
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

const formatCurrency = (amount: number) => {
  return `${new Intl.NumberFormat("vi-VN").format(amount)}đ`;
};

const MetroBuyTicketsStep1Page: NextPage = () => {
  const router = useRouter();
  const [stations, setStations] = useState<StationDto[]>([]);
  const [isLoadingStations, setIsLoadingStations] = useState(true);
  const [stationsError, setStationsError] = useState<string | null>(null);
  const [ticketTypes, setTicketTypes] = useState<TicketTypeDto[]>([]);
  const [isLoadingTicketTypes, setIsLoadingTicketTypes] = useState(true);
  const [ticketTypesError, setTicketTypesError] = useState<string | null>(null);

  const [originStationId, setOriginStationId] = useState("");
  const [destinationStationId, setDestinationStationId] = useState("");
  const [travelDate] = useState(getTodayInputDate);
  const [passengerCount, setPassengerCount] = useState(PASSENGER_OPTIONS[0]);
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const [estimatedFare, setEstimatedFare] = useState<number | null>(null);
  const [isLoadingFare, setIsLoadingFare] = useState(false);
  const [fareError, setFareError] = useState<string | null>(null);

  const stationsById = useMemo(() => {
    return new Map(stations.map((s) => [s.id, s]));
  }, [stations]);

  const estimatedTicketType = useMemo(() => {
    return ticketTypes
      .filter((ticket) => ticket.isActive !== false)
      .sort(
        (left, right) => ticketTypePriority(left) - ticketTypePriority(right),
      )[0];
  }, [ticketTypes]);

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

  useEffect(() => {
    let cancelled = false;

    const loadTicketTypes = async () => {
      setIsLoadingTicketTypes(true);
      setTicketTypesError(null);
      try {
        const data = await publicApi.getTicketTypes();
        if (!cancelled) setTicketTypes(data);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Không thể tải loại vé để tính giá";
        if (!cancelled) setTicketTypesError(message);
      } finally {
        if (!cancelled) setIsLoadingTicketTypes(false);
      }
    };

    loadTicketTypes();

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
    if (
      !originStationId ||
      !destinationStationId ||
      originStationId === destinationStationId
    ) {
      setEstimatedFare(null);
      setIsLoadingFare(false);
      setFareError(null);
      return;
    }

    if (isLoadingTicketTypes) {
      setEstimatedFare(null);
      setIsLoadingFare(true);
      setFareError(null);
      return;
    }

    if (!estimatedTicketType) {
      setEstimatedFare(null);
      setIsLoadingFare(false);
      setFareError(
        ticketTypesError ?? "Không có loại vé hoạt động để tính giá dự kiến",
      );
      return;
    }

    if (routeDistanceKm === undefined) {
      setEstimatedFare(null);
      setIsLoadingFare(false);
      setFareError(
        "Không có tọa độ hợp lệ của ga đi hoặc ga đến để tính khoảng cách",
      );
      return;
    }

    let cancelled = false;

    const loadEstimatedFare = async () => {
      setEstimatedFare(null);
      setIsLoadingFare(true);
      setFareError(null);

      try {
        const total = await fareCalcApi.calculate({
          originId: originStationId,
          destinationId: destinationStationId,
          ticketTypeName: estimatedTicketType.name,
          distance: routeDistanceKm,
        });

        if (!Number.isFinite(total)) {
          throw new Error("Phản hồi giá vé không hợp lệ");
        }

        if (!cancelled) {
          setEstimatedFare(total);
        }
      } catch (err) {
        if (!cancelled) {
          // Ưu tiên đọc message từ Backend trả về
          if (axios.isAxiosError(err) && err.response?.data?.message) {
            setFareError(err.response.data.message);
          } else {
            // Fallback nếu không phải lỗi Axios
            setFareError(
              err instanceof Error ? err.message : "Không thể tính giá dự kiến",
            );
          }
        }
      } finally {
        if (!cancelled) {
          setIsLoadingFare(false);
        }
      }
    };

    loadEstimatedFare();

    return () => {
      cancelled = true;
    };
  }, [
    destinationStationId,
    estimatedTicketType,
    isLoadingTicketTypes,
    originStationId,
    routeDistanceKm,
    ticketTypesError,
  ]);

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
            <h1 className="text-4xl leading-10 font-black text-neutral-900">
              Mua vé
            </h1>

            <div className="flex items-start gap-8 border-b border-slate-300 text-sm font-bold tracking-tight">
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
              <article className="flex flex-col gap-6 rounded-xl bg-white px-6 py-6 shadow-[0px_1px_2px_rgba(0,0,0,0.05)] outline outline-1 outline-slate-200">
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

                <div className="flex items-center justify-between border-t border-slate-200 pt-6">
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
                <div className="absolute inset-0 flex flex-col justify-center px-8 text-white">
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
              <article className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-[0px_1px_2px_rgba(0,0,0,0.05)] outline outline-1 outline-slate-200">
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

                <div className="flex flex-col gap-1 border-t border-slate-200 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                      Giá dự kiến
                      {estimatedTicketType
                        ? ` (${estimatedTicketType.name})`
                        : ""}
                      :
                    </span>
                    <span className="text-xl leading-7 font-black text-blue-600">
                      {isLoadingFare
                        ? "Đang tính..."
                        : estimatedFare === null
                          ? "--"
                          : formatCurrency(estimatedFare)}
                    </span>
                  </div>
                  {fareError ? (
                    <p className="text-right text-xs leading-4 text-red-600">
                      {fareError}
                    </p>
                  ) : null}
                  <p className="text-right text-[10px] leading-4 text-slate-500">
                    Giá chính xác sẽ hiển thị ở bước tiếp theo
                  </p>
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
