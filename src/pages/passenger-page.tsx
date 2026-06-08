import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import PassengerTicketQrModal from "@components/organisms/PassengerTicketQrModal/PassengerTicketQrModal";
import PassengerShell from "@components/templates/PassengerShell";
import { myTicketApi } from "@features/myTicket/myTicketApi";
import type {
  MyTicketDto,
  QrTokenResult,
} from "@features/myTicket/myTicketTypes";
import { tripApi } from "@features/trip/tripApi";
import type { TripDto } from "@features/trip/tripTypes";
import { displayTicketTypeName } from "@utils/ticketTypeName";
import {
  Bell,
  CalendarClock,
  ChevronRight,
  CreditCard,
  QrCode,
  Ticket,
  TrainFront,
} from "lucide-react";

type StatCard = {
  label: string;
  value: string;
  tone: "green" | "blue" | "amber" | "red";
  subLabel?: string;
};

type TicketCard = {
  rawId?: string;
  status: "Sẵn sàng sử dụng" | "Chưa dùng" | "Đã dùng" | "Hết hạn";
  code: string;
  type: string;
  route: string;
  issuedAt?: string;
  expiredAt?: string;
  tone: "green" | "amber" | "red";
  disabled?: boolean;
};

type TripRow = {
  date: string;
  from: string;
  to: string;
  fare: string;
  status: string;
};

const PURCHASE_SUMMARY_KEY = "metro-passenger-purchase-summary";
const QR_TTL_FALLBACK_SECONDS = 600;
const VIETNAM_TIME_ZONE = "Asia/Ho_Chi_Minh";
const EXPLICIT_TIME_ZONE_PATTERN = /(?:Z|[+-]\d{2}:?\d{2})$/i;

const statIcons = {
  green: Ticket,
  blue: TrainFront,
  amber: CreditCard,
  red: Bell,
};

const toneClass = {
  green: {
    badge: "bg-green-500/10 text-green-600",
    border: "border-t-green-500",
    icon: "bg-green-500/10 text-green-600",
  },
  blue: {
    badge: "bg-blue-500/10 text-blue-600",
    border: "border-t-blue-500",
    icon: "bg-blue-500/10 text-blue-600",
  },
  amber: {
    badge: "bg-amber-500/10 text-amber-600",
    border: "border-t-amber-500",
    icon: "bg-amber-500/10 text-amber-600",
  },
  red: {
    badge: "bg-red-500/10 text-red-600",
    border: "border-t-red-500",
    icon: "bg-red-500/10 text-red-600",
  },
};

const mapTicketStatus = (status?: string): TicketCard["status"] => {
  const v = (status ?? "").toLowerCase();
  if (
    v.includes("used") ||
    v.includes("completed") ||
    v.includes("consumed") ||
    v.includes("finished") ||
    v.includes("checked_out") ||
    v.includes("tap_out") ||
    v.includes("exited")
  )
    return "Đã dùng";
  if (v.includes("expired") || v.includes("inactive") || v.includes("invalid"))
    return "Hết hạn";
  if (
    v.includes("ready") ||
    v.includes("active") ||
    v.includes("valid") ||
    v.includes("using") ||
    v.includes("in_use") ||
    v.includes("checked_in") ||
    v.includes("tap_in") ||
    v.includes("entered")
  )
    return "Sẵn sàng sử dụng";
  if (v.includes("new") || v.includes("unused") || v.includes("created"))
    return "Chưa dùng";
  return "Chưa dùng";
};

const mapTicketTone = (status: TicketCard["status"]): TicketCard["tone"] => {
  if (status === "Sẵn sàng sử dụng") return "green";
  if (status === "Chưa dùng") return "amber";
  if (status === "Đã dùng") return "red";
  return "red";
};

const translateTicketTypeName = (ticketTypeName?: string, ticketTypeId?: string) => {
  return displayTicketTypeName(ticketTypeName || ticketTypeId);
};

const formatMoneyVnd = (value?: number) => {
  if (typeof value !== "number") return "0đ";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
};

const parseApiDate = (value: string) => {
  const trimmed = value.trim();
  const normalized =
    /\d{2}:\d{2}/.test(trimmed) && !EXPLICIT_TIME_ZONE_PATTERN.test(trimmed)
      ? `${trimmed.replace(" ", "T")}Z`
      : trimmed;
  return new Date(normalized);
};

const formatDateTime = (value?: string) => {
  if (!value) return "--";
  const date = parseApiDate(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("vi-VN", { timeZone: VIETNAM_TIME_ZONE });
};

const statusTone = (status?: string) => {
  const value = (status ?? "").toLowerCase();
  if (
    value.includes("fail") ||
    value.includes("cancel") ||
    value.includes("reject")
  ) {
    return "bg-red-100 text-red-700";
  }
  if (value.includes("pending") || value.includes("progress")) {
    return "bg-amber-100 text-amber-700";
  }
  return "bg-green-100 text-green-700";
};

const isUsedTicketStatus = (status: TicketCard["status"]) => status === "Đã dùng";

const parseQrDate = (value?: string) => {
  if (!value) return Number.NaN;
  const normalized = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value) ? value : `${value}Z`;
  return new Date(normalized).getTime();
};

const resolveQrSeconds = (qrResult: QrTokenResult) => {
  if (qrResult.expiresAt) {
    const expiresAt = parseQrDate(qrResult.expiresAt);
    if (!Number.isNaN(expiresAt)) {
      return Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
    }
  }

  if (qrResult.createdAt) {
    const createdAt = parseQrDate(qrResult.createdAt);
    if (!Number.isNaN(createdAt)) {
      const expiresAt = createdAt + QR_TTL_FALLBACK_SECONDS * 1000;
      return Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
    }
  }

  if (
    typeof qrResult.ttlSeconds === "number" &&
    Number.isFinite(qrResult.ttlSeconds) &&
    qrResult.ttlSeconds > 0
  ) {
    return Math.max(0, Math.floor(qrResult.ttlSeconds));
  }

  return QR_TTL_FALLBACK_SECONDS;
};

export default function PassengerPage() {
  const [selectedTicket, setSelectedTicket] = useState<TicketCard | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(
    QR_TTL_FALLBACK_SECONDS,
  );

  const [tickets, setTickets] = useState<MyTicketDto[]>([]);
  const [trips, setTrips] = useState<TripDto[]>([]);
  const [localPurchaseSpend, setLocalPurchaseSpend] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [qrRefreshing, setQrRefreshing] = useState(false);
  const [qrRefreshKey, setQrRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);

      try {
        const [ticketResult, tripResult] = await Promise.allSettled([
          myTicketApi.list(),
          tripApi.list({ page: 0, limit: 3 }),
        ]);

        if (cancelled) return;
        if (ticketResult.status === "fulfilled") {
          setTickets(ticketResult.value);
        }
        if (tripResult.status === "fulfilled") {
          setTrips(tripResult.value.items);
        }
      } catch {
        // Dashboard keeps its empty states if the optional passenger data is unavailable.
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const rawSummary = window.localStorage.getItem(PURCHASE_SUMMARY_KEY);
      const summaries = rawSummary ? JSON.parse(rawSummary) : [];
      if (!Array.isArray(summaries)) return;

      const total = summaries.reduce((sum, item) => {
        if (!item || typeof item !== "object") return sum;
        const value = Number((item as { total?: unknown }).total);
        return Number.isFinite(value) ? sum + value : sum;
      }, 0);
      setLocalPurchaseSpend(total);
    } catch {
      setLocalPurchaseSpend(0);
    }
  }, []);

  const derivedStats: StatCard[] = useMemo(() => {
    const activeCount = tickets.filter(
      (t) => mapTicketStatus(t.status) === "Sẵn sàng sử dụng",
    ).length;
    const apiSpend =
      trips.reduce(
        (sum, trip) => sum + (typeof trip.fare === "number" ? trip.fare : 0),
        0,
      ) ||
      tickets.reduce(
        (sum, ticket) =>
          sum + (typeof ticket.price === "number" ? ticket.price : 0),
        0,
      );
    const spend = Math.max(apiSpend, localPurchaseSpend);

    return [
      { label: "Vé đang hoạt động", value: String(activeCount), tone: "green" },
      { label: "Chuyến đi", value: String(trips.length), tone: "blue" },
      { label: "Chi phí", value: formatMoneyVnd(spend), tone: "amber" },
      { label: "Thông báo", value: "0", subLabel: "mới", tone: "red" },
    ];
  }, [localPurchaseSpend, tickets, trips]);

  const derivedRecentTickets: TicketCard[] = useMemo(() => {
    return tickets.slice(0, 3).map((t) => {
      const status = mapTicketStatus(t.status);
      const tone = mapTicketTone(status);
      const route =
        t.routeName ||
        [t.originStationName, t.destinationStationName]
          .filter(Boolean)
          .join(" - ") ||
        "Tuyến metro";
      return {
        rawId: t.id,
        status,
        code: t.code ? `#${t.code}` : `#${t.id}`,
        type: translateTicketTypeName(t.ticketTypeName, t.ticketTypeId),
        route,
        issuedAt: t.issuedAt,
        expiredAt: t.expiredAt || t.validTo,
        tone,
        disabled: status === "Hết hạn",
      };
    });
  }, [tickets]);

  const derivedTableRows = useMemo<TripRow[]>(
    () =>
      trips.slice(0, 3).map((trip) => ({
        date: formatDateTime(trip.checkInAt),
        from: trip.originStationName || "--",
        to: trip.destinationStationName || "--",
        fare: formatMoneyVnd(trip.fare),
        status: trip.status || "Thành công",
      })),
    [trips],
  );

  useEffect(() => {
    if (!selectedTicket?.rawId) {
      setQrImageUrl(null);
      setQrError(null);
      return;
    }

    let cancelled = false;
    const loadQr = async () => {
      setQrError(null);
      setQrRefreshing(true);
      try {
        const tokenRes = await myTicketApi.createQrToken(
          selectedTicket.rawId as string,
        );
        if (cancelled) return;
        if (!tokenRes.token) throw new Error("Backend không trả QR token.");

        const qrcode = await import("qrcode");
        const imageUrl = await qrcode.toDataURL(tokenRes.token, {
          margin: 1,
          width: 192,
        });
        if (!cancelled) {
          setRemainingSeconds(resolveQrSeconds(tokenRes));
          setQrImageUrl(imageUrl);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Không thể tạo QR";
        if (!cancelled) setQrError(message);
      } finally {
        if (!cancelled) setQrRefreshing(false);
      }
    };

    void loadQr();
    return () => {
      cancelled = true;
    };
  }, [qrRefreshKey, selectedTicket?.rawId]);

  useEffect(() => {
    if (!selectedTicket) {
      return;
    }

    const timer = setInterval(() => {
      setRemainingSeconds((previous) => (previous > 0 ? previous - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedTicket]);

  useEffect(() => {
    if (!selectedTicket?.rawId || !qrImageUrl || qrRefreshing || qrError || remainingSeconds > 0) {
      return;
    }

    setQrRefreshKey((current) => current + 1);
  }, [qrError, qrImageUrl, qrRefreshing, remainingSeconds, selectedTicket?.rawId]);

  const countdown = `${String(Math.floor(remainingSeconds / 60)).padStart(2, "0")}:${String(remainingSeconds % 60).padStart(2, "0")}`;

  return (
    <>
      <Head>
        <title>Passenger Page | MetroNext</title>
      </Head>

      <PassengerShell>
        <div className="mx-auto w-full max-w-330 space-y-6 lg:space-y-8">
          <div className="space-y-6 lg:space-y-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-500">
                  <span>Hành khách</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                  <span className="text-neutral-900">Dashboard</span>
                </div>
                <h1 className="text-3xl font-black leading-tight text-neutral-900 sm:text-4xl">
                  Tổng quan
                </h1>
              </div>

            </div>

            {isLoading ? (
              <div className="rounded-3xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-700">
                Đang tải dữ liệu...
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
              {derivedStats.map((stat) => {
                const StatIcon = statIcons[stat.tone];
                return (
                  <article
                    key={stat.label}
                    className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-[0px_8px_24px_-14px_rgba(15,23,42,0.25)] backdrop-blur transition hover:-translate-y-0.5 sm:rounded-3xl sm:p-6"
                  >
                    <div
                      className={`mb-4 inline-flex rounded-2xl p-2 sm:mb-6 ${toneClass[stat.tone].icon}`}
                    >
                      <StatIcon className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-medium text-slate-500">
                      {stat.label}
                    </p>
                    <div className="mt-1 flex items-end gap-2">
                      <p className="break-words text-xl font-black leading-7 text-slate-900 sm:text-3xl sm:leading-9">
                        {stat.value}
                      </p>
                      {stat.subLabel ? (
                        <span className="text-sm font-bold text-red-600">
                          {stat.subLabel}
                        </span>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="space-y-8">
              <div className="space-y-8">
                <section>
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                      Vé gần đây
                    </h2>
                    <Link
                      href="/passenger-page/my-tickets"
                    className="shrink-0 text-sm font-semibold text-blue-600"
                    >
                      Xem tất cả
                    </Link>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                    {derivedRecentTickets.map((ticket) => (
                      <article
                        key={ticket.code}
                        className={`flex min-w-0 flex-col rounded-3xl border border-white/60 border-t-4 bg-white/85 p-4 shadow-[0px_10px_30px_-18px_rgba(15,23,42,0.35)] backdrop-blur sm:p-5 ${
                          toneClass[ticket.tone].border
                        } ${ticket.disabled || isUsedTicketStatus(ticket.status) ? "opacity-75" : ""}`}
                      >
                        <div className="mb-4 flex items-start justify-between">
                          <span
                            className={`rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${toneClass[ticket.tone].badge}`}
                          >
                            {ticket.status}
                          </span>
                          <span className="text-xs font-medium text-slate-400">
                            {ticket.code}
                          </span>
                        </div>

                        <p className="text-xs font-bold uppercase tracking-tight text-slate-500">
                          {ticket.type}
                        </p>
                        <p className="mb-3 text-base font-bold leading-6 text-slate-900">
                          {ticket.route}
                        </p>

                        <div className="mb-4 space-y-2 rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-2.5 text-xs text-slate-600">
                          <div className="flex items-start justify-between gap-3">
                            <span>Ngày mua</span>
                            <span className="text-right font-semibold text-slate-800">
                              {formatDateTime(ticket.issuedAt)}
                            </span>
                          </div>
                          <div className="flex items-start justify-between gap-3">
                            <span>Trạng thái</span>
                            <span className="text-right font-semibold text-blue-600">
                              {ticket.status}
                            </span>
                          </div>
                          <div className="flex items-start justify-between gap-3">
                            <span>Hạn sử dụng</span>
                            <span className="text-right font-semibold text-amber-600">
                              Đến {formatDateTime(ticket.expiredAt)}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (!ticket.disabled && !isUsedTicketStatus(ticket.status)) setSelectedTicket(ticket);
                          }}
                          className={`${isUsedTicketStatus(ticket.status) ? "hidden" : "mt-auto inline-flex"} w-full items-center justify-center gap-1 rounded-2xl py-2 text-xs font-bold ${
                            ticket.disabled
                              ? "border border-slate-300 text-slate-500"
                              : "border border-blue-600 text-blue-600"
                          }`}
                        >
                          <QrCode className="h-3.5 w-3.5" />
                          {ticket.disabled ? "Vô hiệu" : "Xem QR"}
                        </button>
                      </article>
                    ))}
                    {!derivedRecentTickets.length && !isLoading ? (
                      <div className="rounded-3xl border border-dashed border-slate-200 bg-white/70 p-6 text-sm font-medium text-slate-500 sm:col-span-2 2xl:col-span-3">
                        Bạn chưa có vé nào. Hãy mua vé để bắt đầu chuyến đi.
                      </div>
                    ) : null}
                  </div>
                </section>

                <section>
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-neutral-900 sm:text-xl">
                      Chuyến gần nhất
                    </h2>
                    <button className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900">
                      <CalendarClock className="h-3.5 w-3.5" />
                      Tháng này
                    </button>
                  </div>

                  <div className="overflow-hidden rounded-3xl border border-white/60 bg-white/85 shadow-[0px_10px_30px_-18px_rgba(15,23,42,0.35)] backdrop-blur">
                    <div className="overflow-x-auto">
                      <div className="min-w-[720px]">
                        <div className="grid grid-cols-5 bg-slate-50 text-xs font-bold uppercase text-slate-500">
                          <div className="px-6 py-4">Ngày</div>
                          <div className="px-6 py-4">Ga vào</div>
                          <div className="px-6 py-4">Ga ra</div>
                          <div className="px-6 py-4">Giá vé</div>
                          <div className="px-6 py-4">Trạng thái</div>
                        </div>

                        {derivedTableRows.map((row, index) => (
                          <div
                            key={row.date + row.from}
                            className={`grid grid-cols-5 text-sm text-slate-900 ${index > 0 ? "border-t border-slate-100" : ""}`}
                          >
                            <div className="px-6 py-4 font-medium">
                              {row.date}
                            </div>
                            <div className="px-6 py-4">{row.from}</div>
                            <div className="px-6 py-4">{row.to}</div>
                            <div className="px-6 py-4 font-bold">
                              {row.fare}
                            </div>
                            <div className="px-6 py-4">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${statusTone(row.status)}`}
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                {row.status}
                              </span>
                            </div>
                          </div>
                        ))}
                        {!derivedTableRows.length && !isLoading ? (
                          <div className="px-6 py-10 text-center text-sm font-medium text-slate-500">
                            Chưa có chuyến đi gần đây.
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>

        {selectedTicket ? (
          <PassengerTicketQrModal
            ticketCode={selectedTicket.code}
            qrImageUrl={qrImageUrl}
            isRefreshing={qrRefreshing}
            error={qrError}
            countdown={countdown}
            onClose={() => setSelectedTicket(null)}
          />
        ) : null}
      </PassengerShell>
    </>
  );
}
