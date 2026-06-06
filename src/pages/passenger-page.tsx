/* eslint-disable @next/next/no-img-element */
import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import PassengerShell from "@components/templates/PassengerShell";
import { myTicketApi } from "@features/myTicket/myTicketApi";
import type {
  MyTicketDto,
  QrTokenResult,
} from "@features/myTicket/myTicketTypes";
import { tripApi } from "@features/trip/tripApi";
import type { TripDto } from "@features/trip/tripTypes";
import {
  Bell,
  CalendarClock,
  CircleAlert,
  Clock3,
  Download,
  X,
  ChevronRight,
  CreditCard,
  Plus,
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

const mapTicketTypeLabel = (ticketTypeId?: string) => {
  const v = (ticketTypeId ?? "").toLowerCase();
  if (v.includes("month") || v.includes("thang")) return "Vé Tháng";
  if (v.includes("day") || v.includes("ngay")) return "Vé Ngày";
  return "Vé Lượt";
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

const downloadTextFile = (filename: string, content: string, mimeType: string) => {
  if (typeof document === "undefined") return;

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

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
        type: t.ticketTypeName || mapTicketTypeLabel(t.ticketTypeId),
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

  const downloadDashboardCsv = () => {
    const rows = [
      ["Loai", "Ma", "Trang thai", "Tuyen", "Gia tri"],
      ...derivedRecentTickets.map((ticket) => [
        "Ve gan day",
        ticket.code,
        ticket.status,
        ticket.route,
        ticket.type,
      ]),
      ...derivedTableRows.map((trip) => [
        "Chuyen gan nhat",
        trip.date,
        trip.status,
        `${trip.from} - ${trip.to}`,
        trip.fare,
      ]),
    ];
    const csv = rows
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");

    downloadTextFile(
      `metro-passenger-dashboard-${new Date().toISOString().slice(0, 10)}.csv`,
      `\uFEFF${csv}`,
      "text/csv;charset=utf-8",
    );
  };

  const downloadQrImage = () => {
    if (!qrImageUrl || !selectedTicket) return;

    const link = document.createElement("a");
    link.href = qrImageUrl;
    const ticketCode = selectedTicket.code.startsWith("#")
      ? selectedTicket.code.slice(1)
      : selectedTicket.code;
    link.download = `metro-qr-${ticketCode}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <>
      <Head>
        <title>Passenger Page | MetroNext</title>
      </Head>

      <PassengerShell>
        <div className="mx-auto w-full max-w-330 space-y-8">
          <div className="space-y-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-500">
                  <span>Hành khách</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                  <span className="text-neutral-900">Dashboard</span>
                </div>
                <h1 className="text-4xl font-black leading-10 text-neutral-900">
                  Tổng quan
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                type="button"
                onClick={downloadDashboardCsv}
                disabled={!derivedRecentTickets.length && !derivedTableRows.length}
                className="relative inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-[0px_8px_18px_-14px_rgba(15,23,42,0.35)] transition hover:border-blue-200 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:hidden"
              >
                <Download className="h-4 w-4" />
                Tải xuống
                <span>Táº£i xuá»‘ng</span>
              </button>

              <Link
                href="/passenger-page/buy-tickets-step-1"
                className="relative inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-[0px_10px_15px_-3px_rgba(19,127,236,0.20)]"
              >
                <Plus className="h-4 w-4" />
                <span>Mua vé ngay</span>
              </Link>
              </div>
            </div>

            {isLoading ? (
              <div className="rounded-3xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-700">
                Đang tải dữ liệu...
              </div>
            ) : null}

            <div className="grid gap-6 lg:grid-cols-4">
              {derivedStats.map((stat) => {
                const StatIcon = statIcons[stat.tone];
                return (
                  <article
                    key={stat.label}
                    className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-[0px_8px_24px_-14px_rgba(15,23,42,0.25)] backdrop-blur transition hover:-translate-y-0.5"
                  >
                    <div
                      className={`mb-6 inline-flex rounded-2xl p-2 ${toneClass[stat.tone].icon}`}
                    >
                      <StatIcon className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-medium text-slate-500">
                      {stat.label}
                    </p>
                    <div className="mt-1 flex items-end gap-2">
                      <p className="text-3xl font-black leading-9 text-slate-900">
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

            <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_288px]">
              <div className="space-y-8">
                <section>
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900">
                      Vé gần đây
                    </h2>
                    <Link
                      href="/passenger-page/recent-tickets"
                      className="text-sm font-semibold text-blue-600"
                    >
                      Xem tất cả
                    </Link>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                    {derivedRecentTickets.map((ticket) => (
                      <article
                        key={ticket.code}
                        className={`flex flex-col rounded-3xl border border-white/60 border-t-4 bg-white/85 p-5 shadow-[0px_10px_30px_-18px_rgba(15,23,42,0.35)] backdrop-blur ${
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
                    <h2 className="text-xl font-bold text-neutral-900">
                      Chuyến gần nhất
                    </h2>
                    <button className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900">
                      <CalendarClock className="h-3.5 w-3.5" />
                      Tháng này
                    </button>
                  </div>

                  <div className="overflow-hidden rounded-3xl border border-white/60 bg-white/85 shadow-[0px_10px_30px_-18px_rgba(15,23,42,0.35)] backdrop-blur">
                    <div className="overflow-x-auto">
                      <div className="min-w-180">
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

              <aside className="space-y-8">
                <section className="rounded-3xl border border-white/60 bg-white/85 p-6 shadow-[0px_10px_30px_-18px_rgba(15,23,42,0.35)] backdrop-blur">
                  <h3 className="mb-6 text-lg font-bold text-slate-900">
                    Thao tác nhanh
                  </h3>
                  <div className="space-y-3">
                    <Link
                      href="/passenger-page/buy-tickets-step-1"
                      className="flex w-full items-center justify-between rounded-3xl border border-blue-600/10 bg-blue-600/5 p-4 text-blue-600"
                    >
                      <div className="flex items-center gap-3">
                        <Ticket className="h-5 w-5" />
                        <span className="text-base font-bold">Mua vé lượt</span>
                      </div>
                      <ChevronRight className="h-4 w-4" />
                    </Link>

                    <Link
                      href="/passenger-page/my-tickets"
                      className="flex w-full items-center justify-between rounded-3xl bg-slate-100 p-4 text-slate-700"
                    >
                      <div className="flex items-center gap-3">
                        <CalendarClock className="h-5 w-5" />
                        <span className="text-base font-bold">Vé của tôi</span>
                      </div>
                      <ChevronRight className="h-4 w-4" />
                    </Link>

                    <Link
                      href="/passenger-page/history"
                      className="flex w-full items-center justify-between rounded-3xl bg-slate-100 p-4 text-slate-700"
                    >
                      <div className="flex items-center gap-3">
                        <Clock3 className="h-5 w-5" />
                        <span className="text-base font-bold">
                          Lịch sử chuyến
                        </span>
                      </div>
                      <ChevronRight className="h-4 w-4" />
                    </Link>

                    <Link
                      href="/passenger-page/schedule"
                      className="flex w-full items-center justify-between rounded-3xl bg-slate-100 p-4 text-slate-700"
                    >
                      <div className="flex items-center gap-3">
                        <TrainFront className="h-5 w-5" />
                        <span className="text-base font-bold">
                          Xem lịch tàu
                        </span>
                      </div>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </section>

                <section className="relative h-48 overflow-hidden rounded-3xl border border-white/60 shadow-[0px_10px_30px_-18px_rgba(15,23,42,0.35)]">
                  <img
                    src="https://placehold.co/295x190"
                    alt="Metro map"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-linear-to-r from-black/80 via-black/30 to-black/0" />
                  <div className="absolute inset-x-4 bottom-4 text-white">
                    <p className="text-xs font-bold uppercase tracking-wider text-white/80">
                      Trạng thái hệ thống
                    </p>
                    <p className="text-lg font-bold">Đang hoạt động ổn định</p>
                    <p className="mt-2 inline-flex items-center gap-2 text-xs font-medium">
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      9/9 Tuyến đang vận hành
                    </p>
                  </div>
                </section>
              </aside>
            </div>
          </div>
        </div>

        {selectedTicket ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-[2px]"
            onClick={() => setSelectedTicket(null)}
            role="presentation"
          >
            <div
              className="w-full max-w-sm overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Mã QR vào cổng"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                <h3 className="text-lg font-bold text-slate-900">
                  Mã QR Vào cổng
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="rounded-2xl p-1 text-slate-400 transition hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="px-6 pb-6 pt-8">
                <div className="mb-6 flex justify-center">
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
                    <img
                      src={
                        qrImageUrl ??
                        "https://placehold.co/192x192?text=QR+Loading"
                      }
                      alt={qrImageUrl ? "Ticket QR" : "Đang tải QR"}
                      className={`h-48 w-48 ${qrRefreshing ? "opacity-40" : ""}`}
                    />
                  </div>
                </div>

                {qrError ? (
                  <div className="mb-6 flex items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                    <CircleAlert className="h-4 w-4 text-red-500" />
                    <p className="text-sm font-bold text-red-600">{qrError}</p>
                  </div>
                ) : null}

                <div className="mb-6 text-center">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Mã vé của bạn
                  </p>
                  <p className="text-2xl font-black text-blue-600">
                    {selectedTicket.code}
                  </p>
                </div>

                <div className="mb-6 flex items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                  <CircleAlert className="h-4 w-4 text-red-500" />
                  <p className="text-sm font-bold text-red-600">
                    {qrRefreshing ? "Đang đổi mã QR..." : "Đổi mã mới sau: "}
                    {!qrRefreshing ? (
                      <span className="font-black">{countdown}</span>
                    ) : null}
                  </p>
                </div>

                <p className="text-center text-sm leading-6 text-slate-500">
                  Đưa mã này vào máy quét tại cổng để vào
                  <br />
                  ga
                </p>

                <button
                  type="button"
                  onClick={downloadQrImage}
                  disabled={!qrImageUrl || qrRefreshing}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 py-3 text-sm font-bold text-blue-600 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <Download className="h-4 w-4" />
                  Tải ảnh QR
                </button>
              </div>

              <div className="border-t border-slate-100 bg-slate-50 px-6 py-5">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-base font-bold text-white shadow-[0px_10px_15px_-3px_rgba(19,127,236,0.20)]"
                >
                  <Clock3 className="h-4 w-4" />
                  Đóng
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </PassengerShell>
    </>
  );
}
