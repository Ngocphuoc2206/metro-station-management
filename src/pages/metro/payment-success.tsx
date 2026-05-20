/* eslint-disable @next/next/no-img-element */
import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import PassengerShell from "@components/templates/PassengerShell";
import { orderApi } from "@features/order/orderApi";
import { myTicketApi } from "@features/myTicket/myTicketApi";
import type { MyTicketDto, QrTokenResult } from "@features/myTicket/myTicketTypes";
import { Check, Download, QrCode, ShieldCheck, Ticket } from "lucide-react";

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

const formatDateTime = (date: string) => {
  if (!date) {
    return "24h kể từ khi kích hoạt lần đầu";
  }

  const [year, month, day] = date.split("-");
  if (!year || !month || !day) {
    return "24h kể từ khi kích hoạt lần đầu";
  }

  return `${day}/${month}/${year} 23:59`;
};

const randomTicketCode = () => {
  const seed = Math.floor(1000 + Math.random() * 9000);
  return `MN-2026-${seed}`;
};

const extractTicketIdFromOrder = (order: unknown): string | null => {
  if (!order || typeof order !== "object") return null;
  const anyOrder = order as Record<string, unknown>;

  const direct = anyOrder.ticketId;
  if (typeof direct === "string" && direct) return direct;

  const data = anyOrder.data;
  if (data && typeof data === "object") {
    const anyData = data as Record<string, unknown>;
    const ticketId = anyData.ticketId;
    if (typeof ticketId === "string" && ticketId) return ticketId;

    const ticket = anyData.ticket;
    if (ticket && typeof ticket === "object") {
      const anyTicket = ticket as Record<string, unknown>;
      const nested = anyTicket.id;
      if (typeof nested === "string" && nested) return nested;
    }

    const tickets = anyData.tickets;
    if (Array.isArray(tickets) && tickets.length > 0) {
      const first = tickets[0] as Record<string, unknown> | null;
      const firstId = first?.id;
      if (typeof firstId === "string" && firstId) return firstId;
    }
  }

  return null;
};

const formatIsoDateTime = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const MetroPaymentSuccessPage: NextPage = () => {
  const router = useRouter();
  const [journeyState, setJourneyState] =
    useState<JourneyState>(emptyJourneyState);
  const [step2State, setStep2State] = useState<Step2State>({});
  const [ticketCode, setTicketCode] = useState("MN-2026-0000");
  const [showSuccessToast, setShowSuccessToast] = useState(true);

  const [isLoadingTicket, setIsLoadingTicket] = useState(false);
  const [ticketError, setTicketError] = useState<string | null>(null);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [ticket, setTicket] = useState<MyTicketDto | null>(null);
  const [qrToken, setQrToken] = useState<QrTokenResult | null>(null);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const toastTimer = window.setTimeout(() => {
      setShowSuccessToast(false);
    }, 4500);

    return () => {
      window.clearTimeout(toastTimer);
    };
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTicketCode(randomTicketCode());

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

    const hasJourneyFromQuery =
      fromQuery.originStationId &&
      fromQuery.destinationStationId &&
      fromQuery.travelDate &&
      fromQuery.passengerCount;

    if (hasJourneyFromQuery) {
      setJourneyState({
        ...fromQuery,
        originStationName: "",
        destinationStationName: "",
      });
    }

    if (typeof window === "undefined") {
      return;
    }

    if (!hasJourneyFromQuery) {
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

  const orderIdFromQuery =
    typeof router.query.orderId === "string" ? router.query.orderId : "";

  useEffect(() => {
    if (!orderIdFromQuery) {
      return;
    }

    let cancelled = false;

    const loadTicketAndQr = async () => {
      setIsLoadingTicket(true);
      setTicketError(null);

      try {
        const order = await orderApi.getById(orderIdFromQuery);
        const extractedTicketId = extractTicketIdFromOrder(order);

        if (!extractedTicketId) {
          throw new Error(
            "Không tìm thấy ticketId trong đơn hàng. Vui lòng kiểm tra response GET /orders/{id}.",
          );
        }

        if (cancelled) return;
        setTicketId(extractedTicketId);

        const [ticketRes, tokenRes] = await Promise.all([
          myTicketApi.getById(extractedTicketId),
          myTicketApi.createQrToken(extractedTicketId),
        ]);

        if (cancelled) return;
        setTicket(ticketRes);
        setQrToken(tokenRes);

        // Generate QR image from token
        const qrcode = await import("qrcode");
        const dataUrl = await qrcode.toDataURL(tokenRes.token, {
          margin: 1,
          width: 192,
        });

        if (!cancelled) setQrImageUrl(dataUrl);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Không thể tải vé";
        if (!cancelled) setTicketError(message);
      } finally {
        if (!cancelled) setIsLoadingTicket(false);
      }
    };

    loadTicketAndQr();

    return () => {
      cancelled = true;
    };
  }, [orderIdFromQuery]);

  const ticketTypeFromQuery =
    typeof router.query.ticketType === "string" ? router.query.ticketType : "";

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

  const journeyText = useMemo(() => {
    if (!journeyState.originStationId || !journeyState.destinationStationId) {
      return "Đang cập nhật";
    }

    const from = journeyState.originStationName || journeyState.originStationId;
    const to = journeyState.destinationStationName || journeyState.destinationStationId;
    return `${from} - ${to}`;
  }, [
    journeyState.destinationStationId,
    journeyState.destinationStationName,
    journeyState.originStationId,
    journeyState.originStationName,
  ]);

  const handleViewMyTickets = async () => {
    await router.push("/passenger-page/my-tickets");
  };

  const handleDownloadMock = () => {
    window.alert(
      "Bản PDF giả lập sẽ được bổ sung ở bản tích hợp thanh toán thật.",
    );
  };

  return (
    <PassengerShell>
      <div className="mx-auto w-full max-w-[1200px]">
        <section className="relative flex min-w-0 flex-col gap-6">
          {showSuccessToast ? (
            <>
              <div className="pointer-events-none fixed right-6 top-20 z-30 hidden rounded-3xl bg-emerald-500 px-4 py-3 text-white shadow-lg lg:flex lg:items-center lg:gap-3">
                <Check className="h-5 w-5" />
                <span className="text-sm font-semibold">
                  Thanh toán hoàn tất!
                </span>
              </div>

              <div className="fixed bottom-4 left-4 right-4 z-30 rounded-2xl bg-emerald-500 px-4 py-3 text-white shadow-lg lg:hidden">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5" />
                  <span className="text-sm font-semibold">
                    Thanh toán hoàn tất!
                  </span>
                </div>
              </div>
            </>
          ) : null}

          <div className="flex flex-1 justify-center">
            <div className="w-full max-w-[896px]">
              <div className="mb-10 flex flex-col items-center text-center">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
                  <ShieldCheck className="h-10 w-10 text-emerald-600" />
                </div>
                <h2 className="pb-2 text-3xl font-extrabold leading-9 text-slate-900">
                  Thanh toán thành công!
                </h2>
                <p className="max-w-[390px] text-base leading-6 text-slate-600">
                  Cảm ơn bạn đã sử dụng dịch vụ MetroNext. Vé của bạn đã sẵn
                  sàng để sử dụng.
                </p>
              </div>

              <div className="mx-auto flex w-full max-w-[480px] flex-col gap-8">
                {ticketError ? (
                  <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 outline outline-1 outline-offset-[-1px] outline-red-100">
                    {ticketError}
                  </div>
                ) : null}

                <article className="relative overflow-hidden rounded-xl bg-white outline outline-1 outline-slate-200 shadow-2xl">
                  <div className="pointer-events-none absolute inset-0 opacity-10 [background:linear-gradient(315deg,rgba(37,99,235,0.05)_12%,transparent_13%,rgba(37,99,235,0.05)_100%)]" />

                  <div className="relative flex flex-col gap-6 p-8">
                    <div className="inline-flex items-start justify-between border-b border-slate-300 pb-6">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wide text-blue-600">
                          MetroNext Digital Ticket
                        </p>
                        <h3 className="text-xl font-bold leading-7 text-slate-900">
                          {ticket?.ticketTypeId ? selectedTicket.name : selectedTicket.name}
                        </h3>
                      </div>
                      <div className="text-right">
                        <p className="text-xs leading-4 text-slate-500">
                          Trạng thái
                        </p>
                        <span className="inline-flex rounded-lg bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-600">
                          {isLoadingTicket ? "Đang tải" : "Sẵn sàng"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-center">
                      <div className="rounded-3xl bg-white p-4 shadow-[inset_0px_2px_4px_1px_rgba(0,0,0,0.05)] outline outline-1 outline-slate-100">
                        <div className="relative h-48 w-48 overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50">
                          <img
                            src={
                              qrImageUrl ??
                              "https://placehold.co/192x192?text=QR+Loading"
                            }
                            alt={
                              qrImageUrl
                                ? "QR token động"
                                : "Đang tải QR token"
                            }
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-slate-900/70 px-2 py-1 text-center text-[10px] text-white">
                            {qrToken?.expiresAt
                              ? `Hết hạn: ${formatIsoDateTime(qrToken.expiresAt)}`
                              : qrImageUrl
                                ? "QR token động"
                                : "Đang tải..."}
                          </div>
                        </div>
                      </div>
                      <p className="pt-4 font-mono text-[10px] tracking-wide text-slate-400">
                        {qrToken?.token ?? ticket?.code ?? ticketId ?? ticketCode}
                      </p>
                    </div>

                    <div className="relative h-32">
                      <div className="absolute left-0 top-0 w-52">
                        <p className="text-xs leading-4 text-slate-500">
                          Hành trình
                        </p>
                        <p className="text-sm font-bold leading-5 text-slate-900">
                          {journeyText}
                        </p>
                      </div>
                      <div className="absolute right-0 top-0 w-52 pb-3.5">
                        <p className="text-xs leading-4 text-slate-500">
                          Mã vé
                        </p>
                        <p className="text-sm font-bold leading-5 text-slate-900">
                          {ticket?.code ?? ticketId ?? ticketCode}
                        </p>
                      </div>
                      <div className="absolute left-0 top-[79px] w-full">
                        <p className="text-xs leading-4 text-slate-500">
                          Thời hạn sử dụng
                        </p>
                        <p className="text-sm font-bold leading-5 text-slate-900">
                          Đến {formatDateTime(journeyState.travelDate)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="relative flex h-4 items-center justify-center bg-slate-50">
                    <div className="h-0.5 w-full border-t-2 border-slate-200" />
                    <div className="absolute -left-3 -top-1 h-6 w-6 rounded-full bg-neutral-100" />
                    <div className="absolute -right-3 -top-1 h-6 w-6 rounded-full bg-neutral-100" />
                  </div>

                  <div className="flex flex-col gap-3 bg-slate-50 p-8">
                    <button
                      type="button"
                      onClick={handleViewMyTickets}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3.5 text-base font-bold text-white"
                    >
                      <Ticket className="h-5 w-5" />
                      Xem trong Vé của tôi
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadMock}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white py-3.5 text-base font-bold text-slate-700 outline outline-1 outline-slate-200"
                    >
                      <Download className="h-4 w-4" />
                      Tải vé (PDF)
                    </button>
                  </div>
                </article>

                <article className="relative rounded-3xl bg-blue-600/5 p-4 outline outline-1 outline-blue-600/10">
                  <QrCode className="absolute left-4 top-5 h-5 w-5 text-blue-600" />
                  <p className="pl-8 pr-2 text-sm leading-6">
                    <span className="font-bold text-slate-900">Hướng dẫn:</span>
                    <span className="text-slate-600">
                      {" "}
                      Vui lòng quét mã QR tại cổng kiểm soát (turnstile) để vào
                      ga. Đảm bảo độ sáng màn hình ở mức cao nhất.
                    </span>
                  </p>
                </article>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PassengerShell>
  );
};

export default MetroPaymentSuccessPage;
