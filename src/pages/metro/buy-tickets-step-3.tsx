import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { MetroAuthHeader } from "@components/organisms/MetroAuthHeader/MetroAuthHeader";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Check,
  CreditCard,
  History,
  MapPin,
  QrCode,
  Settings,
  ShieldCheck,
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

type Step2State = {
  selectedTicketId?: string;
  selectedTicketName?: string;
  selectedTicketSubtitle?: string;
  selectedTicketPrice?: number;
};

type PaymentMethod = "ewallet" | "card" | "vietqr";

type TicketInfo = {
  id: string;
  name: string;
  subtitle: string;
  price: number;
};

const STEP1_STORAGE_KEY = "metro-buy-ticket-step1";
const STEP2_STORAGE_KEY = "metro-buy-ticket-step2";

const emptyJourneyState: JourneyState = {
  originStation: "",
  destinationStation: "",
  travelDate: "",
  passengerCount: "",
  isRoundTrip: false,
};

const TICKET_DEFAULT_BY_ID: Record<string, TicketInfo> = {
  single: {
    id: "single",
    name: "Vé lượt",
    subtitle: "Single Journey",
    price: 15000,
  },
  day: {
    id: "day",
    name: "Vé ngày",
    subtitle: "Day Pass",
    price: 40000,
  },
  month: {
    id: "month",
    name: "Vé tháng",
    subtitle: "Month Pass",
    price: 200000,
  },
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

const MetroBuyTicketsStep3Page: NextPage = () => {
  const router = useRouter();
  const [journeyState, setJourneyState] = useState<JourneyState>(emptyJourneyState);
  const [step2State, setStep2State] = useState<Step2State>({});
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>("ewallet");
  const [promotionCode, setPromotionCode] = useState("");
  const [isPaymentSuccess, setIsPaymentSuccess] = useState(false);

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
      const rawStep1 = window.sessionStorage.getItem(STEP1_STORAGE_KEY);
      if (rawStep1) {
        try {
          const parsedStep1 = JSON.parse(rawStep1) as JourneyState;
          if (
            parsedStep1.originStation &&
            parsedStep1.destinationStation &&
            parsedStep1.travelDate &&
            parsedStep1.passengerCount
          ) {
            setJourneyState(parsedStep1);
          }
        } catch {
          setJourneyState(emptyJourneyState);
        }
      }
    }

    const rawStep2 = window.sessionStorage.getItem(STEP2_STORAGE_KEY);
    if (!rawStep2) {
      return;
    }

    try {
      const parsed = JSON.parse(rawStep2) as Step2State;
      setStep2State(parsed);
    } catch {
      setStep2State({});
    }
  }, [router.query]);

  const ticketTypeFromQuery = typeof router.query.ticketType === "string" ? router.query.ticketType : "";

  const hasJourneyState = useMemo(() => {
    return Boolean(
      journeyState.originStation &&
        journeyState.destinationStation &&
        journeyState.travelDate &&
        journeyState.passengerCount,
    );
  }, [journeyState]);

  const selectedTicket = useMemo<TicketInfo>(() => {
    const id = step2State.selectedTicketId || ticketTypeFromQuery || "day";
    const defaultTicket = TICKET_DEFAULT_BY_ID[id] ?? TICKET_DEFAULT_BY_ID.day;

    return {
      id: defaultTicket.id,
      name: step2State.selectedTicketName || defaultTicket.name,
      subtitle: step2State.selectedTicketSubtitle || defaultTicket.subtitle,
      price: typeof step2State.selectedTicketPrice === "number" ? step2State.selectedTicketPrice : defaultTicket.price,
    };
  }, [step2State, ticketTypeFromQuery]);

  const subtotal = selectedTicket.price;
  const serviceFee = 0;
  const totalPrice = subtotal + serviceFee;

  const goBackToStep2 = async () => {
    await router.push({
      pathname: "/metro/buy-tickets-step-2",
      query: {
        ...router.query,
      },
    });
  };

  const handleApplyPromotion = () => {
    if (!promotionCode.trim()) {
      return;
    }

    setPromotionCode(promotionCode.trim());
  };

  const handleConfirmPayment = () => {
    if (!hasJourneyState) {
      return;
    }

    setIsPaymentSuccess(true);
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
              <div className="border-b-[3px] border-green-500 pb-3 pt-4 text-green-500">
                <span className="inline-flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  1. Hành trình
                </span>
              </div>
              <div className="border-b-[3px] border-green-500 pb-3 pt-4 text-green-500">
                <span className="inline-flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  2. Loại vé
                </span>
              </div>
              <div className="border-b-[3px] border-blue-600 pb-3 pt-4 text-blue-600">3. Thanh toán</div>
            </div>
          </div>

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="flex min-w-0 flex-col gap-6">
              <article className="flex flex-col gap-6 rounded-xl bg-white p-8 shadow-[0px_1px_2px_rgba(0,0,0,0.05)] outline outline-1 outline-slate-200">
                <h2 className="text-xl leading-7 font-bold text-neutral-900">Phương thức thanh toán</h2>

                <div className="flex flex-col gap-4">
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod("ewallet")}
                    className={`flex w-full items-center justify-between rounded-3xl p-4 text-left transition ${
                      selectedPaymentMethod === "ewallet"
                        ? "bg-blue-600/5 outline-2 outline-blue-600"
                        : "outline outline-1 outline-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                          selectedPaymentMethod === "ewallet" ? "border-blue-600" : "border-slate-300"
                        }`}
                      >
                        <span
                          className={`h-3 w-3 rounded-full ${
                            selectedPaymentMethod === "ewallet" ? "bg-blue-600" : "bg-transparent"
                          }`}
                        />
                      </span>
                      <div>
                        <p className="text-base leading-6 font-bold text-neutral-900">Ví điện tử</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] leading-4 font-bold text-neutral-900">
                          <span className="rounded-xl bg-slate-200 px-2 py-0.5">MOMO</span>
                          <span className="rounded-xl bg-slate-200 px-2 py-0.5">ZALOPAY</span>
                          <span className="rounded-xl bg-slate-200 px-2 py-0.5">SHOPEEPAY</span>
                        </div>
                      </div>
                    </div>
                    <Wallet className={selectedPaymentMethod === "ewallet" ? "h-5 w-5 text-blue-600" : "h-5 w-5 text-slate-500"} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod("card")}
                    className={`flex w-full items-center justify-between rounded-3xl p-4 text-left transition ${
                      selectedPaymentMethod === "card"
                        ? "bg-blue-600/5 outline-2 outline-blue-600"
                        : "outline outline-1 outline-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                          selectedPaymentMethod === "card" ? "border-blue-600" : "border-slate-300"
                        }`}
                      >
                        <span
                          className={`h-3 w-3 rounded-full ${
                            selectedPaymentMethod === "card" ? "bg-blue-600" : "bg-transparent"
                          }`}
                        />
                      </span>
                      <div>
                        <p className="text-base leading-6 font-bold text-neutral-900">Thẻ ngân hàng</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] leading-4 font-bold text-neutral-900">
                          <span className="rounded-xl bg-slate-200 px-2 py-0.5">VISA</span>
                          <span className="rounded-xl bg-slate-200 px-2 py-0.5">MASTERCARD</span>
                          <span className="rounded-xl bg-slate-200 px-2 py-0.5">ATM</span>
                        </div>
                      </div>
                    </div>
                    <CreditCard className={selectedPaymentMethod === "card" ? "h-5 w-5 text-blue-600" : "h-5 w-5 text-slate-500"} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod("vietqr")}
                    className={`flex w-full items-center justify-between rounded-3xl p-4 text-left transition ${
                      selectedPaymentMethod === "vietqr"
                        ? "bg-blue-600/5 outline-2 outline-blue-600"
                        : "outline outline-1 outline-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                          selectedPaymentMethod === "vietqr" ? "border-blue-600" : "border-slate-300"
                        }`}
                      >
                        <span
                          className={`h-3 w-3 rounded-full ${
                            selectedPaymentMethod === "vietqr" ? "bg-blue-600" : "bg-transparent"
                          }`}
                        />
                      </span>
                      <div>
                        <p className="text-base leading-6 font-bold text-neutral-900">Quét mã QR (VietQR)</p>
                        <p className="text-xs leading-4 text-slate-500">Thanh toán nhanh qua ứng dụng ngân hàng</p>
                      </div>
                    </div>
                    <QrCode className={selectedPaymentMethod === "vietqr" ? "h-5 w-5 text-blue-600" : "h-5 w-5 text-slate-500"} />
                  </button>
                </div>

                <div className="flex flex-col gap-2 border-t border-slate-200 pt-10">
                  <label htmlFor="promotion-code" className="text-sm leading-5 font-semibold text-neutral-900">
                    Mã giảm giá
                  </label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      id="promotion-code"
                      type="text"
                      value={promotionCode}
                      onChange={(event) => setPromotionCode(event.target.value)}
                      placeholder="Nhập mã ưu đãi (nếu có)"
                      className="h-11 flex-1 rounded-xl border border-slate-300 px-3 text-sm text-neutral-900 placeholder:text-gray-500 focus:border-blue-600 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleApplyPromotion}
                      className="rounded-xl bg-slate-200 px-6 py-2.5 text-sm font-bold text-neutral-900 transition hover:bg-slate-300"
                    >
                      Áp dụng
                    </button>
                  </div>
                </div>
              </article>

              <article className="relative h-24 overflow-hidden rounded-xl">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 opacity-90" />
                <div className="absolute inset-0 flex items-center gap-4 px-8 text-white">
                  <ShieldCheck className="h-6 w-6 opacity-90" />
                  <div>
                    <h3 className="text-base leading-6 font-bold">Thanh toán an toàn & bảo mật</h3>
                    <p className="text-xs leading-4 opacity-80">
                      Mọi giao dịch đều được mã hóa và bảo mật theo tiêu chuẩn quốc tế.
                    </p>
                  </div>
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
                        <p className="text-[10px] font-bold leading-4 tracking-wide text-slate-500 uppercase">Hành trình</p>
                        <p className="text-sm font-medium leading-5 text-neutral-900">
                          {journeyState.originStation} - {journeyState.destinationStation}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Ticket className="mt-0.5 h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-[10px] font-bold leading-4 tracking-wide text-slate-500 uppercase">Loại vé</p>
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
                    <span className="font-semibold text-neutral-900">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Phí dịch vụ:</span>
                    <span className="font-semibold text-neutral-900">{formatCurrency(serviceFee)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-200 pt-2">
                    <span className="text-base font-bold text-neutral-900">Tổng thanh toán:</span>
                    <span className="text-2xl font-black text-blue-600">{formatCurrency(totalPrice)}</span>
                  </div>
                </div>

                {isPaymentSuccess ? (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                    Thanh toán mẫu thành công. Hệ thống chưa tích hợp cổng thanh toán thật.
                  </div>
                ) : null}

                <div className="flex flex-col gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleConfirmPayment}
                    disabled={!hasJourneyState}
                    className={`inline-flex items-center justify-center gap-3 rounded-xl py-4 text-base font-bold text-white transition ${
                      hasJourneyState ? "bg-blue-600 hover:bg-blue-700" : "cursor-not-allowed bg-slate-300"
                    }`}
                  >
                    Xác nhận thanh toán
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={goBackToStep2}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-200 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-slate-300"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Quay lại
                  </button>
                </div>
              </article>
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
};

export default MetroBuyTicketsStep3Page;
