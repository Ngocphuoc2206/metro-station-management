import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import PassengerShell from "@components/templates/PassengerShell";
import { orderApi } from "@features/order/orderApi";
import { paymentApi } from "@features/payment/paymentApi";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CreditCard,
  MapPin,
  QrCode,
  ShieldCheck,
  Ticket,
  Wallet,
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
  originStationId: "",
  originStationName: "",
  destinationStationId: "",
  destinationStationName: "",
  travelDate: "",
  passengerCount: "",
  isRoundTrip: false,
};

const parsePassengerCount = (value: string) => {
  const match = value.match(/\d+/);
  return match ? Number(match[0]) : 1;
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
  const [journeyState, setJourneyState] =
    useState<JourneyState>(emptyJourneyState);
  const [step2State, setStep2State] = useState<Step2State>({});
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod>("ewallet");
  const [promotionCode, setPromotionCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

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

    if (hasAllFromQuery) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setJourneyState({
        ...fromQuery,
        originStationName: "",
        destinationStationName: "",
      });
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
            parsedStep1.originStationId &&
            parsedStep1.destinationStationId &&
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

  const ticketTypeFromQuery =
    typeof router.query.ticketType === "string" ? router.query.ticketType : "";

  const hasJourneyState = useMemo(() => {
    return Boolean(
      journeyState.originStationId &&
      journeyState.destinationStationId &&
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
      price:
        typeof step2State.selectedTicketPrice === "number"
          ? step2State.selectedTicketPrice
          : defaultTicket.price,
    };
  }, [step2State, ticketTypeFromQuery]);

  const subtotal = selectedTicket.price;
  const serviceFee = 0;
  const totalPrice = subtotal + serviceFee;

  const goBackToStep2 = async () => {
    await router.push({
      pathname: "/passenger-page/buy-tickets-step-2",
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

  const handleConfirmPayment = async () => {
    if (!hasJourneyState) {
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      const passengerNum = parsePassengerCount(journeyState.passengerCount);

      const order = await orderApi.create({
        fromStationId: journeyState.originStationId,
        toStationId: journeyState.destinationStationId,
        ticketTypeId: selectedTicket.id,
        passengerCount: passengerNum,
        isRoundTrip: journeyState.isRoundTrip,
        travelDate: journeyState.travelDate,
        promotionCode: promotionCode.trim() || undefined,
        paymentMethod: selectedPaymentMethod,
      });

      const payment = await paymentApi.init({
        orderId: order.id,
        method: selectedPaymentMethod,
        returnUrl:
          typeof window !== "undefined" ? `${window.location.origin}/passenger-page/payment-success` : undefined,
      });

      if (payment.redirectUrl || payment.checkoutUrl) {
        const url = payment.redirectUrl ?? payment.checkoutUrl;
        if (url) {
          window.location.href = url;
          return;
        }
      }

      // Poll payment status (basic)
      const start = Date.now();
      const timeoutMs = 30_000;
      const intervalMs = 2_000;

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const latest = await paymentApi.getById(payment.id);
        const status = String(latest.status ?? "").toUpperCase();

        if (["SUCCESS", "SUCCEEDED", "PAID", "COMPLETED"].includes(status)) {
          break;
        }

        if (["FAILED", "CANCELED", "CANCELLED", "ERROR"].includes(status)) {
          throw new Error("Thanh toán thất bại hoặc bị huỷ");
        }

        if (Date.now() - start > timeoutMs) {
          throw new Error("Thanh toán đang xử lý quá lâu, vui lòng thử lại");
        }

        await new Promise((r) => setTimeout(r, intervalMs));
      }

      await router.push({
        pathname: "/passenger-page/payment-success",
        query: {
          ...router.query,
          ticketType: selectedTicket.id,
          orderId: order.id,
          paymentId: payment.id,
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể khởi tạo thanh toán";
      setPaymentError(message);
    } finally {
      setIsProcessing(false);
    }
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
              <div className="border-b-[3px] border-blue-600 pb-3 pt-4 text-blue-600">
                3. Thanh toán
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="flex min-w-0 flex-col gap-6">
              <article className="flex flex-col gap-6 rounded-xl bg-white p-8 shadow-[0px_1px_2px_rgba(0,0,0,0.05)] outline outline-1 outline-slate-200">
                <h2 className="text-xl leading-7 font-bold text-neutral-900">
                  Phương thức thanh toán
                </h2>

                <div className="flex flex-col gap-4">
                  {paymentError ? (
                    <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 outline outline-1 outline-offset-[-1px] outline-red-100">
                      {paymentError}
                    </div>
                  ) : null}

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
                          selectedPaymentMethod === "ewallet"
                            ? "border-blue-600"
                            : "border-slate-300"
                        }`}
                      >
                        <span
                          className={`h-3 w-3 rounded-full ${
                            selectedPaymentMethod === "ewallet"
                              ? "bg-blue-600"
                              : "bg-transparent"
                          }`}
                        />
                      </span>
                      <div>
                        <p className="text-base leading-6 font-bold text-neutral-900">
                          Ví điện tử
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] leading-4 font-bold text-neutral-900">
                          <span className="rounded-xl bg-slate-200 px-2 py-0.5">
                            MOMO
                          </span>
                          <span className="rounded-xl bg-slate-200 px-2 py-0.5">
                            ZALOPAY
                          </span>
                          <span className="rounded-xl bg-slate-200 px-2 py-0.5">
                            SHOPEEPAY
                          </span>
                        </div>
                      </div>
                    </div>
                    <Wallet
                      className={
                        selectedPaymentMethod === "ewallet"
                          ? "h-5 w-5 text-blue-600"
                          : "h-5 w-5 text-slate-500"
                      }
                    />
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
                          selectedPaymentMethod === "card"
                            ? "border-blue-600"
                            : "border-slate-300"
                        }`}
                      >
                        <span
                          className={`h-3 w-3 rounded-full ${
                            selectedPaymentMethod === "card"
                              ? "bg-blue-600"
                              : "bg-transparent"
                          }`}
                        />
                      </span>
                      <div>
                        <p className="text-base leading-6 font-bold text-neutral-900">
                          Thẻ ngân hàng
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] leading-4 font-bold text-neutral-900">
                          <span className="rounded-xl bg-slate-200 px-2 py-0.5">
                            VISA
                          </span>
                          <span className="rounded-xl bg-slate-200 px-2 py-0.5">
                            MASTERCARD
                          </span>
                          <span className="rounded-xl bg-slate-200 px-2 py-0.5">
                            ATM
                          </span>
                        </div>
                      </div>
                    </div>
                    <CreditCard
                      className={
                        selectedPaymentMethod === "card"
                          ? "h-5 w-5 text-blue-600"
                          : "h-5 w-5 text-slate-500"
                      }
                    />
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
                          selectedPaymentMethod === "vietqr"
                            ? "border-blue-600"
                            : "border-slate-300"
                        }`}
                      >
                        <span
                          className={`h-3 w-3 rounded-full ${
                            selectedPaymentMethod === "vietqr"
                              ? "bg-blue-600"
                              : "bg-transparent"
                          }`}
                        />
                      </span>
                      <div>
                        <p className="text-base leading-6 font-bold text-neutral-900">
                          Quét mã QR (VietQR)
                        </p>
                        <p className="text-xs leading-4 text-slate-500">
                          Thanh toán nhanh qua ứng dụng ngân hàng
                        </p>
                      </div>
                    </div>
                    <QrCode
                      className={
                        selectedPaymentMethod === "vietqr"
                          ? "h-5 w-5 text-blue-600"
                          : "h-5 w-5 text-slate-500"
                      }
                    />
                  </button>
                </div>

                <div className="flex flex-col gap-2 border-t border-slate-200 pt-10">
                  <label
                    htmlFor="promotion-code"
                    className="text-sm leading-5 font-semibold text-neutral-900"
                  >
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
                    <h3 className="text-base leading-6 font-bold">
                      Thanh toán an toàn & bảo mật
                    </h3>
                    <p className="text-xs leading-4 opacity-80">
                      Mọi giao dịch đều được mã hóa và bảo mật theo tiêu chuẩn
                      quốc tế.
                    </p>
                  </div>
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
                          Hành trình
                        </p>
                        <p className="text-sm font-medium leading-5 text-neutral-900">
                          {journeyState.originStationName || journeyState.originStationId} -{" "}
                          {journeyState.destinationStationName || journeyState.destinationStationId}
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
                      {formatCurrency(subtotal)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Phí dịch vụ:</span>
                    <span className="font-semibold text-neutral-900">
                      {formatCurrency(serviceFee)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-200 pt-2">
                    <span className="text-base font-bold text-neutral-900">
                      Tổng thanh toán:
                    </span>
                    <span className="text-2xl font-black text-blue-600">
                      {formatCurrency(totalPrice)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleConfirmPayment}
                    disabled={!hasJourneyState || isProcessing}
                    className={`inline-flex items-center justify-center gap-3 rounded-xl py-4 text-base font-bold text-white transition ${
                      hasJourneyState && !isProcessing
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "cursor-not-allowed bg-slate-300"
                    }`}
                  >
                    {isProcessing ? "Đang xử lý..." : "Xác nhận thanh toán"}
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
      </div>
    </PassengerShell>
  );
};

export default MetroBuyTicketsStep3Page;
