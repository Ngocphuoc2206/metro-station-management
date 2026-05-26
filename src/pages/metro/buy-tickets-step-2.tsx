import type { NextPage } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import PassengerShell from "@components/templates/PassengerShell";
import { orderApi } from "@features/order/orderApi";
import type { OrderPreviewResult, OrderRequest } from "@features/order/orderTypes";
import { publicApi } from "@features/public/publicApi";
import type { StationDto, TicketTypeDto } from "@features/public/publicTypes";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  Circle,
  MapPin,
  Ticket,
} from "lucide-react";

type JourneyState = {
  originStationId: string;
  originStationName: string;
  destinationStationId: string;
  destinationStationName: string;
  travelDate: string;
  passengerCount: string;
  isRoundTrip: boolean;
};

type TicketTypeCard = {
  id: string;
  name: string;
  subtitle: string;
  description: string[];
  price?: number;
  highlighted?: boolean;
  badge?: string;
};

const STEP1_STORAGE_KEY = "metro-buy-ticket-step1";
const STEP2_STORAGE_KEY = "metro-buy-ticket-step2";
const TICKET_TYPE_LABELS: Record<string, string> = {
  single: "Vé lượt",
  daily: "Vé ngày",
  monthly: "Vé tháng",
};

const emptyState: JourneyState = {
  originStationId: "",
  originStationName: "",
  destinationStationId: "",
  destinationStationName: "",
  travelDate: "",
  passengerCount: "",
  isRoundTrip: false,
};

const parsePassengerCount = (value: string) => {
  const counts = value.match(/\d+/g);
  return counts ? counts.reduce((total, count) => total + Number(count), 0) : 1;
};

const buildOrderRequest = (
  journeyState: JourneyState,
  ticketTypeId: string,
): OrderRequest => {
  const quantity = parsePassengerCount(journeyState.passengerCount);
  const outbound = {
    ticketTypeId,
    quantity,
    fromStationId: journeyState.originStationId,
    toStationId: journeyState.destinationStationId,
  };

  return {
    items: journeyState.isRoundTrip
      ? [
          outbound,
          {
            ticketTypeId,
            quantity,
            fromStationId: journeyState.destinationStationId,
            toStationId: journeyState.originStationId,
          },
        ]
      : [outbound],
  };
};

const toTicketCard = (t: TicketTypeDto): TicketTypeCard => {
  const typeName = t.name.toLowerCase();
  const validityText =
    typeof t.validityDays === "number"
      ? `Có hiệu lực ${t.validityDays} ngày`
      : undefined;
  return {
    id: t.id,
    name: TICKET_TYPE_LABELS[typeName] ?? t.name,
    subtitle: t.code ?? t.name,
    description: [
      t.description ?? t.conditions ?? "Áp dụng theo quy định của MetroNext.",
      ...(validityText ? [validityText] : []),
    ],
    price: t.price,
    highlighted: typeName === "single",
  };
};

const formatDate = (date: string) => {
  if (!date) {
    return "-- / -- / ----";
  }

  const [year, month, day] = date.split("-");
  if (!year || !month || !day) {
    return "-- / -- / ----";
  }

  return `${day}/${month}/${year}`;
};

const formatCurrency = (amount: number) => {
  return `${new Intl.NumberFormat("vi-VN").format(amount)}đ`;
};

const MetroBuyTicketsStep2Page: NextPage = () => {
  const router = useRouter();
  const [journeyState, setJourneyState] = useState<JourneyState>(emptyState);
  const [stations, setStations] = useState<StationDto[]>([]);
  const [ticketTypes, setTicketTypes] = useState<TicketTypeCard[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);
  const [ticketsError, setTicketsError] = useState<string | null>(null);

  const [selectedTicketId, setSelectedTicketId] = useState<string>("");
  const [orderPreview, setOrderPreview] = useState<OrderPreviewResult | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    const fromQuery = {
      originStationId:
        typeof router.query.from === "string" ? router.query.from : "",
      destinationStationId:
        typeof router.query.to === "string" ? router.query.to : "",
      travelDate:
        typeof router.query.date === "string" ? router.query.date : "",
      passengerCount:
        typeof router.query.passengers === "string"
          ? router.query.passengers
          : "",
      isRoundTrip: router.query.roundTrip === "1",
    };

    const hasAllFromQuery =
      fromQuery.originStationId &&
      fromQuery.destinationStationId &&
      fromQuery.travelDate &&
      fromQuery.passengerCount;

    if (typeof window === "undefined") {
      if (hasAllFromQuery) {
        setJourneyState({
          ...fromQuery,
          originStationName: "",
          destinationStationName: "",
        });
      }
      return;
    }

    const rawStep1Data = window.sessionStorage.getItem(STEP1_STORAGE_KEY);
    let storedJourney: JourneyState | null = null;
    if (rawStep1Data) {
      try {
        const parsedStep1 = JSON.parse(rawStep1Data) as JourneyState;
        if (
          parsedStep1.originStationId &&
          parsedStep1.destinationStationId &&
          parsedStep1.travelDate &&
          parsedStep1.passengerCount
        ) {
          storedJourney = parsedStep1;
        }
      } catch {
        storedJourney = null;
      }
    }

    if (hasAllFromQuery) {
      const matchesStoredStations =
        storedJourney?.originStationId === fromQuery.originStationId &&
        storedJourney.destinationStationId === fromQuery.destinationStationId;
      setJourneyState({
        ...fromQuery,
        originStationName: matchesStoredStations ? (storedJourney?.originStationName ?? "") : "",
        destinationStationName: matchesStoredStations ? (storedJourney?.destinationStationName ?? "") : "",
      });
    } else if (storedJourney) {
      setJourneyState(storedJourney);
    } else {
      setJourneyState(emptyState);
    }

    const rawStep2Data = window.sessionStorage.getItem(STEP2_STORAGE_KEY);
    if (rawStep2Data) {
      try {
        const parsedStep2 = JSON.parse(rawStep2Data) as {
          selectedTicketId?: string;
        };
        if (parsedStep2.selectedTicketId) setSelectedTicketId(parsedStep2.selectedTicketId);
      } catch {
        setSelectedTicketId("");
      }
    }
  }, [router.query]);

  useEffect(() => {
    let cancelled = false;

    publicApi.getStations().then((data) => {
      if (!cancelled) {
        setStations(data);
      }
    }).catch(() => {
      // Names kept from step 1 remain usable if station lookup fails.
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadTickets = async () => {
      setIsLoadingTickets(true);
      setTicketsError(null);
      try {
        const raw = await publicApi.getTicketTypes();
        const cards = raw
          .filter((ticket) => ticket.isActive !== false)
          .map(toTicketCard);
        if (!cancelled) {
          setTicketTypes(cards);
          if (!selectedTicketId && cards.length > 0) {
            setSelectedTicketId(cards.find((c) => c.highlighted)?.id ?? cards[0].id);
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Không thể tải danh sách vé";
        if (!cancelled) setTicketsError(message);
      } finally {
        if (!cancelled) setIsLoadingTickets(false);
      }
    };

    loadTickets();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.sessionStorage.setItem(
      STEP2_STORAGE_KEY,
      JSON.stringify({ selectedTicketId }),
    );
  }, [selectedTicketId]);

  const hasJourneyState = useMemo(() => {
    return Boolean(
      journeyState.originStationId &&
      journeyState.destinationStationId &&
      journeyState.travelDate &&
      journeyState.passengerCount,
    );
  }, [journeyState]);

  const selectedTicket = useMemo(() => {
    return ticketTypes.find((ticket) => ticket.id === selectedTicketId) ?? null;
  }, [selectedTicketId, ticketTypes]);

  const stationNamesById = useMemo(
    () => new Map(stations.map((station) => [station.id, station.name])),
    [stations],
  );
  const originStationName =
    journeyState.originStationName ||
    stationNamesById.get(journeyState.originStationId) ||
    journeyState.originStationId;
  const destinationStationName =
    journeyState.destinationStationName ||
    stationNamesById.get(journeyState.destinationStationId) ||
    journeyState.destinationStationId;

  useEffect(() => {
    if (!hasJourneyState || !selectedTicket) {
      setOrderPreview(null);
      setPreviewError(null);
      setIsLoadingPreview(false);
      return;
    }

    let cancelled = false;

    const loadPricing = async () => {
      setIsLoadingPreview(true);
      setPreviewError(null);
      setOrderPreview(null);

      try {
        const preview = await orderApi.preview(
          buildOrderRequest(journeyState, selectedTicket.id),
        );
        const total = Number(preview.total);

        if (!Number.isFinite(total)) {
          throw new Error("Phản hồi xem trước đơn hàng không có tổng tiền hợp lệ");
        }

        if (!cancelled) {
          setOrderPreview({ ...preview, total });
        }
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Không thể xem trước thông tin đơn hàng";
        if (!cancelled) {
          setPreviewError(message);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingPreview(false);
        }
      }
    };

    loadPricing();

    return () => {
      cancelled = true;
    };
  }, [hasJourneyState, journeyState, selectedTicket]);

  const subtotal = orderPreview?.subtotal;
  const serviceFee = orderPreview ? (orderPreview.serviceFee ?? 0) : undefined;
  const totalPrice = orderPreview?.total;

  const handleContinue = async () => {
    if (!hasJourneyState || !selectedTicket || totalPrice === undefined) {
      return;
    }

    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(
        STEP2_STORAGE_KEY,
        JSON.stringify({
          selectedTicketId: selectedTicket.id,
          selectedTicketName: selectedTicket.name,
          selectedTicketSubtitle: selectedTicket.subtitle,
          selectedTicketPrice: selectedTicket.price,
          selectedOrderTotal: totalPrice,
        }),
      );
    }

    await router.push({
      pathname: "/passenger-page/buy-tickets-step-3",
      query: {
        ...router.query,
        ticketType: selectedTicket.id,
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
              <div className="border-b-[3px] border-blue-600 pb-3 pt-4 text-blue-600 opacity-70">
                <span className="inline-flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  1. Hành trình
                </span>
              </div>
              <div className="border-b-[3px] border-blue-600 pb-3 pt-4 text-blue-600">
                2. Loại vé
              </div>
              <div className="border-b-[3px] border-transparent pb-3 pt-4 text-slate-500">
                3. Thanh toán
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="flex min-w-0 flex-col gap-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {ticketTypes.map((ticket) => {
                  const isSelected = selectedTicketId === ticket.id;
                  return (
                    <article
                      key={ticket.id}
                      className={`relative flex h-full flex-col justify-between rounded-xl bg-white p-6 ${
                        isSelected
                          ? "outline-2 outline-blue-600 shadow-[0px_4px_6px_-4px_rgba(19,127,236,0.10),0px_10px_15px_-3px_rgba(19,127,236,0.10)]"
                          : "outline outline-1 outline-slate-200 shadow-[0px_1px_2px_rgba(0,0,0,0.05)]"
                      }`}
                    >
                      {ticket.badge ? (
                        <div className="absolute right-0 top-0 rounded-bl-xl bg-green-500 px-3 py-1 text-[10px] font-bold tracking-wide text-white uppercase">
                          {ticket.badge}
                        </div>
                      ) : null}

                      <div className="pb-6">
                        <h3 className="text-lg font-bold leading-7 text-neutral-900">
                          {ticket.name}
                        </h3>
                        <p className="text-xs leading-4 text-slate-500">
                          {ticket.subtitle}
                        </p>

                        <ul className="pt-3 text-sm leading-5 text-slate-500">
                          {ticket.description.map((line) => (
                            <li
                              key={line}
                              className="mb-2 flex items-start gap-2"
                            >
                              {ticket.highlighted ? (
                                <Circle className="mt-1 h-2.5 w-2.5 fill-blue-600 text-blue-600" />
                              ) : (
                                <span className="mt-2 inline-block h-1.5 w-1.5 rounded-full bg-slate-400" />
                              )}
                              <span>{line}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex flex-col gap-4">
                        <p
                          className={`text-2xl font-black leading-8 ${
                            isSelected ? "text-blue-600" : "text-neutral-900"
                          }`}
                        >
                          {ticket.price === undefined
                            ? "Theo chặng"
                            : formatCurrency(ticket.price)}
                        </p>

                        <button
                          type="button"
                          onClick={() => setSelectedTicketId(ticket.id)}
                          className={`w-full rounded-xl px-4 py-2 text-sm font-bold leading-5 transition ${
                            isSelected
                              ? "bg-blue-600 text-white"
                              : "outline outline-1 outline-blue-600 text-blue-600 hover:bg-blue-50"
                          }`}
                        >
                          {isSelected ? "Đã chọn" : "Chọn"}
                        </button>
                      </div>
                    </article>
                  );
                })}

                {isLoadingTickets ? (
                  <div className="md:col-span-3 rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600 outline outline-1 outline-offset-[-1px] outline-slate-200">
                    Đang tải loại vé...
                  </div>
                ) : null}

                {ticketsError ? (
                  <div className="md:col-span-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 outline outline-1 outline-offset-[-1px] outline-red-100">
                    {ticketsError}
                  </div>
                ) : null}

                {previewError ? (
                  <div className="md:col-span-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 outline outline-1 outline-offset-[-1px] outline-red-100">
                    {previewError}
                  </div>
                ) : null}
              </div>

              <article className="relative h-32 overflow-hidden rounded-xl">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-400 opacity-90" />
                <div className="absolute -right-8 top-0 h-32 w-40 rounded-l-full bg-white/20" />
                <div className="absolute inset-0 flex flex-col justify-center px-8 text-white">
                  <h3 className="text-lg font-bold leading-7">
                    Trải nghiệm MetroNext 5 sao
                  </h3>
                  <p className="max-w-96 text-xs leading-4 opacity-90">
                    Tiết kiệm hơn khi sử dụng vé tháng trực tuyến. Nhanh chóng,
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

                {hasJourneyState ? (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="mt-0.5 h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-[10px] font-bold leading-4 tracking-wide text-slate-500 uppercase">
                          Ga đi - Ga đến
                        </p>
                        <p className="text-sm font-medium leading-5 text-neutral-900">
                          {originStationName} - {destinationStationName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Ticket className="mt-0.5 h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-[10px] font-bold leading-4 tracking-wide text-slate-500 uppercase">
                          Loại vé
                        </p>
                        <p className="text-sm font-medium leading-5 text-neutral-900">
                          {selectedTicket?.name ?? "--"} ({selectedTicket?.subtitle ?? ""})
                        </p>
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 p-3 text-xs text-slate-600">
                      Ngày đi:{" "}
                      <span className="font-semibold text-neutral-900">
                        {formatDate(journeyState.travelDate)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    Chưa có dữ liệu hành trình. Vui lòng quay lại bước 1.
                  </div>
                )}

                <div className="flex flex-col gap-2 border-t border-slate-200 pt-6 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Tạm tính:</span>
                    <span className="font-semibold text-neutral-900">
                      {subtotal === undefined ? "--" : formatCurrency(subtotal)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Phí dịch vụ:</span>
                    <span className="font-semibold text-neutral-900">
                      {serviceFee === undefined ? "--" : formatCurrency(serviceFee)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-200 pt-2">
                    <span className="text-base font-bold text-neutral-900">
                      Tổng cộng:
                    </span>
                    <span className="text-xl font-black text-blue-600">
                      {isLoadingPreview
                        ? "Đang tải..."
                        : totalPrice === undefined
                          ? "--"
                          : formatCurrency(totalPrice)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleContinue}
                    disabled={
                      !hasJourneyState ||
                      !selectedTicket ||
                      totalPrice === undefined ||
                      isLoadingPreview
                    }
                    className={`inline-flex items-center justify-center gap-4 rounded-xl py-4 text-base font-bold text-white transition ${
                      hasJourneyState &&
                      selectedTicket &&
                      totalPrice !== undefined &&
                      !isLoadingPreview
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "cursor-not-allowed bg-slate-300"
                    }`}
                  >
                    Tiếp tục thanh toán
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <Link
                    href="/passenger-page/buy-tickets-step-1"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-200 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-slate-300"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Quay lại
                  </Link>
                </div>

                <div className="rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600">
                  Dữ liệu được lưu tạm để chuyển sang bước tiếp theo.
                </div>
              </article>
            </aside>
          </div>
        </section>
      </div>
    </PassengerShell>
  );
};

export default MetroBuyTicketsStep2Page;
