import type { NextPage } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { MetroAuthHeader } from "@components/organisms/MetroAuthHeader/MetroAuthHeader";
import {
  ArrowRight,
  Bell,
  Check,
  ChevronLeft,
  Circle,
  History,
  MapPin,
  Settings,
  Ticket,
  User,
  Wallet,
} from "lucide-react";

type JourneyState = {
  originStation: string;
  destinationStation: string;
  travelDate: string;
  passengerCount: string;
  isRoundTrip: boolean;
};

type TicketType = {
  id: "single" | "day" | "month";
  name: string;
  subtitle: string;
  description: string[];
  price: number;
  highlighted?: boolean;
  badge?: string;
};

const STEP1_STORAGE_KEY = "metro-buy-ticket-step1";
const STEP2_STORAGE_KEY = "metro-buy-ticket-step2";

const emptyState: JourneyState = {
  originStation: "",
  destinationStation: "",
  travelDate: "",
  passengerCount: "",
  isRoundTrip: false,
};

const TICKET_TYPES: TicketType[] = [
  {
    id: "single",
    name: "Vé lượt",
    subtitle: "Single Journey",
    description: ["Dành cho hành khách di chuyển một lần", "giữa hai ga đã chọn."],
    price: 15000,
  },
  {
    id: "day",
    name: "Vé ngày",
    subtitle: "Day Pass",
    description: ["Đi lại không giới hạn trong 24h", "Áp dụng cho tất cả các tuyến"],
    price: 40000,
    highlighted: true,
    badge: "Best Value",
  },
  {
    id: "month",
    name: "Vé tháng",
    subtitle: "Month Pass",
    description: ["Di chuyển không giới hạn trong 30 ngày.", "Phù hợp cho người đi làm."],
    price: 200000,
  },
];

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
  const [selectedTicketId, setSelectedTicketId] = useState<TicketType["id"]>("day");

  useEffect(() => {
    const fromQuery = {
      originStation: typeof router.query.from === "string" ? router.query.from : "",
      destinationStation: typeof router.query.to === "string" ? router.query.to : "",
      travelDate: typeof router.query.date === "string" ? router.query.date : "",
      passengerCount: typeof router.query.passengers === "string" ? router.query.passengers : "",
      isRoundTrip: router.query.roundTrip === "1",
    };

    const hasAllFromQuery =
      fromQuery.originStation &&
      fromQuery.destinationStation &&
      fromQuery.travelDate &&
      fromQuery.passengerCount;

    if (hasAllFromQuery) {
      setJourneyState(fromQuery);
    }

    if (typeof window === "undefined") {
      return;
    }

    if (!hasAllFromQuery) {
      const rawStep1Data = window.sessionStorage.getItem(STEP1_STORAGE_KEY);
      if (rawStep1Data) {
        try {
          const parsedStep1 = JSON.parse(rawStep1Data) as JourneyState;
          if (
            parsedStep1.originStation &&
            parsedStep1.destinationStation &&
            parsedStep1.travelDate &&
            parsedStep1.passengerCount
          ) {
            setJourneyState(parsedStep1);
          }
        } catch {
          setJourneyState(emptyState);
        }
      }
    }

    const rawStep2Data = window.sessionStorage.getItem(STEP2_STORAGE_KEY);
    if (rawStep2Data) {
      try {
        const parsedStep2 = JSON.parse(rawStep2Data) as { selectedTicketId?: TicketType["id"] };
        if (parsedStep2.selectedTicketId && TICKET_TYPES.some((ticket) => ticket.id === parsedStep2.selectedTicketId)) {
          setSelectedTicketId(parsedStep2.selectedTicketId);
        }
      } catch {
        setSelectedTicketId("day");
      }
    }
  }, [router.query]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.sessionStorage.setItem(STEP2_STORAGE_KEY, JSON.stringify({ selectedTicketId }));
  }, [selectedTicketId]);

  const hasJourneyState = useMemo(() => {
    return Boolean(
      journeyState.originStation &&
        journeyState.destinationStation &&
        journeyState.travelDate &&
        journeyState.passengerCount,
    );
  }, [journeyState]);

  const selectedTicket = useMemo(() => {
    return TICKET_TYPES.find((ticket) => ticket.id === selectedTicketId) ?? TICKET_TYPES[1];
  }, [selectedTicketId]);

  const serviceFee = 0;
  const totalPrice = selectedTicket.price + serviceFee;

  const handleContinue = async () => {
    if (!hasJourneyState) {
      return;
    }

    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(
        STEP2_STORAGE_KEY,
        JSON.stringify({
          selectedTicketId: selectedTicket.id,
          selectedTicketName: selectedTicket.name,
          selectedTicketPrice: selectedTicket.price,
        }),
      );
    }

    await router.push({
      pathname: "/metro/buy-tickets-step-3",
      query: {
        ...router.query,
        ticketType: selectedTicket.id,
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <MetroAuthHeader />

      <main className="mx-auto grid w-full max-w-[1200px] grid-cols-1 gap-8 px-6 py-8 md:px-10 xl:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="w-full">
          <div className="flex flex-col gap-6 rounded-xl bg-white p-4 outline outline-1 outline-slate-200">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600/10">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-base leading-6 font-medium text-neutral-900">Hành khách</p>
                <p className="text-sm leading-5 font-normal text-slate-500">ID: 12345</p>
              </div>
            </div>

            <nav className="flex flex-col gap-2" aria-label="Passenger navigation">
              <button
                type="button"
                className="inline-flex items-center gap-3 rounded-xl bg-blue-600/10 px-3 py-2 text-sm font-semibold text-blue-600"
              >
                <Ticket className="h-4 w-5" />
                Mua vé
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-neutral-900 hover:bg-slate-100"
              >
                <History className="h-4 w-4" />
                Lịch sử giao dịch
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-neutral-900 hover:bg-slate-100"
              >
                <Wallet className="h-4 w-5" />
                Ví của tôi
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-neutral-900 hover:bg-slate-100"
              >
                <Bell className="h-4 w-4" />
                Thông báo
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-neutral-900 hover:bg-slate-100"
              >
                <Settings className="h-5 w-5" />
                Cài đặt
              </button>
            </nav>
          </div>
        </aside>

        <section className="flex min-w-0 flex-col gap-6">
          <div className="flex flex-col gap-4">
            <h1 className="text-4xl leading-10 font-black text-neutral-900">Mua vé</h1>

            <div className="flex items-start gap-8 border-b border-slate-300 text-sm font-bold tracking-tight">
              <div className="border-b-[3px] border-blue-600 pb-3 pt-4 text-blue-600 opacity-70">
                <span className="inline-flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  1. Hành trình
                </span>
              </div>
              <div className="border-b-[3px] border-blue-600 pb-3 pt-4 text-blue-600">2. Loại vé</div>
              <div className="border-b-[3px] border-transparent pb-3 pt-4 text-slate-500">3. Thanh toán</div>
            </div>
          </div>

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="flex min-w-0 flex-col gap-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {TICKET_TYPES.map((ticket) => {
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
                        <h3 className="text-lg font-bold leading-7 text-neutral-900">{ticket.name}</h3>
                        <p className="text-xs leading-4 text-slate-500">{ticket.subtitle}</p>

                        <ul className="pt-3 text-sm leading-5 text-slate-500">
                          {ticket.description.map((line) => (
                            <li key={line} className="mb-2 flex items-start gap-2">
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
                          {formatCurrency(ticket.price)}
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
              </div>

              <article className="relative h-32 overflow-hidden rounded-xl">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-400 opacity-90" />
                <div className="absolute -right-8 top-0 h-32 w-40 rounded-l-full bg-white/20" />
                <div className="absolute inset-0 flex flex-col justify-center px-8 text-white">
                  <h3 className="text-lg font-bold leading-7">Trải nghiệm MetroNext 5 sao</h3>
                  <p className="max-w-96 text-xs leading-4 opacity-90">
                    Tiết kiệm hơn khi sử dụng vé tháng trực tuyến. Nhanh chóng, tiện lợi, an toàn.
                  </p>
                </div>
              </article>
            </div>

            <aside className="w-full">
              <article className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-[0px_1px_2px_rgba(0,0,0,0.05)] outline outline-1 outline-slate-200">
                <h3 className="text-lg leading-7 font-bold text-neutral-900">Tóm tắt đơn</h3>

                {hasJourneyState ? (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="mt-0.5 h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-[10px] font-bold leading-4 tracking-wide text-slate-500 uppercase">
                          Ga đi - Ga đến
                        </p>
                        <p className="text-sm font-medium leading-5 text-neutral-900">
                          {journeyState.originStation} - {journeyState.destinationStation}
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
                          {selectedTicket.name} ({selectedTicket.subtitle})
                        </p>
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 p-3 text-xs text-slate-600">
                      Ngày đi: <span className="font-semibold text-neutral-900">{formatDate(journeyState.travelDate)}</span>
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
                    <span className="font-semibold text-neutral-900">{formatCurrency(selectedTicket.price)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Phí dịch vụ:</span>
                    <span className="font-semibold text-neutral-900">{formatCurrency(serviceFee)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-200 pt-2">
                    <span className="text-base font-bold text-neutral-900">Tổng cộng:</span>
                    <span className="text-xl font-black text-blue-600">{formatCurrency(totalPrice)}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleContinue}
                    disabled={!hasJourneyState}
                    className={`inline-flex items-center justify-center gap-4 rounded-xl py-4 text-base font-bold text-white transition ${
                      hasJourneyState ? "bg-blue-600 hover:bg-blue-700" : "cursor-not-allowed bg-slate-300"
                    }`}
                  >
                    Tiếp tục thanh toán
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <Link
                    href="/metro/buy-tickets-step-1"
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
      </main>
    </div>
  );
};

export default MetroBuyTicketsStep2Page;
