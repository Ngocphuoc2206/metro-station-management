/* eslint-disable @next/next/no-img-element */
import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import PassengerShell from "@components/templates/PassengerShell";
import { myTicketApi } from "@features/myTicket/myTicketApi";
import type { MyTicketDto } from "@features/myTicket/myTicketTypes";
import { orderApi } from "@features/order/orderApi";
import {
  Bell,
  CalendarClock,
  CircleAlert,
  Clock3,
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
  status: "Sẵn sàng sử dụng" | "Chưa dùng" | "Hết hạn";
  code: string;
  type: string;
  route: string;
  tone: "green" | "amber" | "red";
  disabled?: boolean;
};

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


type OrderRow = {
  id?: string;
  status?: string;
  total?: number;
  createdAt?: string;
  data?: unknown;
};

const mapTicketStatus = (status?: string): TicketCard["status"] => {
  const v = (status ?? "").toLowerCase();
  if (v.includes("expired") || v.includes("inactive") || v.includes("invalid")) return "Hết hạn";
  if (v.includes("ready") || v.includes("active") || v.includes("valid") || v.includes("using") || v.includes("in_use")) return "Sẵn sàng sử dụng";
  if (v.includes("new") || v.includes("unused") || v.includes("created")) return "Chưa dùng";
  return "Chưa dùng";
};

const mapTicketTone = (status: TicketCard["status"]): TicketCard["tone"] => {
  if (status === "Sẵn sàng sử dụng") return "green";
  if (status === "Chưa dùng") return "amber";
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

const formatDateTime = (iso?: string) => {
  if (!iso) return "--";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const safeArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

const extractOrders = (value: unknown): OrderRow[] => {
  if (Array.isArray(value)) return value as OrderRow[];
  if (value && typeof value === "object") {
    const anyValue = value as Record<string, unknown>;
    const items = anyValue.items ?? anyValue.data ?? anyValue.results;
    return safeArray<OrderRow>(items);
  }
  return [];
};

const extractStationsFromOrderData = (data: unknown): { from?: string; to?: string } => {
  if (!data || typeof data !== "object") return {};
  const anyData = data as Record<string, unknown>;

  const from = anyData.originStationName ?? anyData.fromStationName ?? anyData.originName ?? anyData.from;
  const to = anyData.destinationStationName ?? anyData.toStationName ?? anyData.destinationName ?? anyData.to;

  return {
    from: typeof from === "string" ? from : undefined,
    to: typeof to === "string" ? to : undefined,
  };
};

export default function PassengerPage() {
  const [selectedTicket, setSelectedTicket] = useState<TicketCard | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(60);

  const [tickets, setTickets] = useState<MyTicketDto[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [qrRefreshing, setQrRefreshing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const [ticketList, orderStatusRes] = await Promise.all([
          myTicketApi.list(),
          orderApi.getStatus(),
        ]);

        if (cancelled) return;
        setTickets(ticketList);
        setOrders(extractOrders(orderStatusRes));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Không thể tải dữ liệu dashboard";
        if (!cancelled) setLoadError(message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const derivedStats: StatCard[] = useMemo(() => {
    const activeCount = tickets.filter((t) => mapTicketStatus(t.status) === "Sẵn sàng sử dụng").length;
    const orderCount = orders.length;
    const spend = orders.reduce((sum, o) => sum + (typeof o.total === "number" ? o.total : 0), 0);

    return [
      { label: "Vé đang hoạt động", value: String(activeCount), tone: "green" },
      { label: "Đơn hàng", value: String(orderCount), tone: "blue" },
      { label: "Chi phí", value: formatMoneyVnd(spend), tone: "amber" },
      { label: "Thông báo", value: "0", subLabel: "mới", tone: "red" },
    ];
  }, [orders, tickets]);

  const derivedRecentTickets: TicketCard[] = useMemo(() => {
    return tickets.slice(0, 3).map((t) => {
      const status = mapTicketStatus(t.status);
      const tone = mapTicketTone(status);
      return {
        rawId: t.id,
        status,
        code: t.code ? `#${t.code}` : `#${t.id}`,
        type: mapTicketTypeLabel(t.ticketTypeId),
        route: "--",
        tone,
        disabled: status === "Hết hạn",
      };
    });
  }, [tickets]);

  const derivedTableRows = useMemo(() => {
    return orders.slice(0, 3).map((o) => {
      const stations = extractStationsFromOrderData(o.data);
      return {
        date: formatDateTime(o.createdAt),
        from: stations.from ?? "--",
        to: stations.to ?? "--",
        fare: formatMoneyVnd(o.total),
      };
    });
  }, [orders]);

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
        const tokenRes = await myTicketApi.createQrToken(selectedTicket.rawId as string);
        if (cancelled) return;
        if (!tokenRes.token) throw new Error("Backend không trả QR token.");

        let imageUrl = tokenRes.qrCodeUrl;
        if (!imageUrl) {
          const qrcode = await import("qrcode");
          imageUrl = await qrcode.toDataURL(tokenRes.token, {
            margin: 1,
            width: 192,
          });
        }
        if (!cancelled) {
          setRemainingSeconds(60);
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
    const refreshTimer = window.setInterval(() => {
      void loadQr();
    }, 60000);
    return () => {
      cancelled = true;
      window.clearInterval(refreshTimer);
    };
  }, [selectedTicket?.rawId]);

  useEffect(() => {
    if (!selectedTicket) {
      return;
    }

    const timer = setInterval(() => {
      setRemainingSeconds((previous) => (previous > 0 ? previous - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedTicket]);

  const countdown = `${String(Math.floor(remainingSeconds / 60)).padStart(2, "0")}:${String(remainingSeconds % 60).padStart(2, "0")}`;

  return (
    <>
      <Head>
        <title>Passenger Page | MetroNext</title>
      </Head>

      <PassengerShell>
        <div className="mx-auto w-full max-w-[1320px] space-y-8">
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

              <Link
                href="/passenger-page/buy-tickets-step-1"
                className="relative inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-[0px_10px_15px_-3px_rgba(19,127,236,0.20)]"
              >
                <Plus className="h-4 w-4" />
                <span>Mua vé ngay</span>
              </Link>
            </div>

            {loadError ? (
              <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {loadError}
              </div>
            ) : null}

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
                        className={`rounded-3xl border border-white/60 border-t-4 bg-white/85 p-5 shadow-[0px_10px_30px_-18px_rgba(15,23,42,0.35)] backdrop-blur ${
                          toneClass[ticket.tone].border
                        } ${ticket.disabled ? "opacity-75" : ""}`}
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
                        <p className="mb-4 text-base font-bold leading-6 text-slate-900">
                          {ticket.route}
                        </p>

                        <button
                          type="button"
                          onClick={() => {
                            if (!ticket.disabled) setSelectedTicket(ticket);
                          }}
                          className={`inline-flex w-full items-center justify-center gap-1 rounded-2xl py-2 text-xs font-bold ${
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
                              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                Thành công
                              </span>
                            </div>
                          </div>
                        ))}
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
                    <button className="flex w-full items-center justify-between rounded-3xl border border-blue-600/10 bg-blue-600/5 p-4 text-blue-600">
                      <div className="flex items-center gap-3">
                        <Ticket className="h-5 w-5" />
                        <span className="text-base font-bold">Mua vé lượt</span>
                      </div>
                      <ChevronRight className="h-4 w-4" />
                    </button>

                    <button className="flex w-full items-center justify-between rounded-3xl bg-slate-100 p-4 text-slate-700">
                      <div className="flex items-center gap-3">
                        <CalendarClock className="h-5 w-5" />
                        <span className="text-base font-bold">Mua vé ngày</span>
                      </div>
                      <ChevronRight className="h-4 w-4" />
                    </button>

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
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-black/0" />
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
                      src={qrImageUrl ?? "https://placehold.co/192x192?text=QR+Loading"}
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
                    {!qrRefreshing ? <span className="font-black">{countdown}</span> : null}
                  </p>
                </div>

                <p className="text-center text-sm leading-6 text-slate-500">
                  Đưa mã này vào máy quét tại cổng để vào
                  <br />
                  ga
                </p>
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
