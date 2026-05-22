import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { myTicketApi } from "@features/myTicket/myTicketApi";
import type { MyTicketDto, QrTokenResult } from "@features/myTicket/myTicketTypes";
import {
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  History,
  LayoutDashboard,
  QrCode,
  Search,
  Settings,
  Ticket,
  TrainFront,
  UserRound,
  X,
} from "lucide-react";

const BrandMark = ({ className = "h-8 w-8" }: { className?: string }) => (
  <svg
    aria-hidden="true"
    className={className}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M5.333 16c0-5.97 4.697-10.667 10.667-10.667h8v8c0 5.97-4.697 10.667-10.667 10.667h-8v-8Z"
      fill="#2563EB"
    />
    <path
      d="M8 18.667c0-5.97 4.697-10.667 10.667-10.667H24v5.333c0 5.97-4.697 10.667-10.667 10.667H8v-5.333Z"
      fill="#1D4ED8"
    />
  </svg>
);

type TicketItem = {
  id: string;
  rawId: string;
  status: "Hoạt động" | "Chưa dùng" | "Hết hạn";
  ticketType: "Vé lượt" | "Vé tháng" | "Vé ngày";
  route: string;
  validFrom: string;
  validTo: string;
  active: boolean;
};

const formatShortDate = (value?: string) => {
  if (!value) return "--/--/----";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const mapTicketType = (
  ticketTypeId?: string,
): TicketItem["ticketType"] => {
  const v = (ticketTypeId ?? "").toLowerCase();
  if (v.includes("month") || v.includes("thang")) return "Vé tháng";
  if (v.includes("day") || v.includes("ngay")) return "Vé ngày";
  return "Vé lượt";
};

const mapTicketStatus = (status?: string): TicketItem["status"] => {
  const v = (status ?? "").toLowerCase();
  if (
    v.includes("active") ||
    v.includes("valid") ||
    v.includes("in_use") ||
    v.includes("using")
  ) {
    return "Hoạt động";
  }
  if (v.includes("expired") || v.includes("inactive") || v.includes("invalid")) {
    return "Hết hạn";
  }
  if (v.includes("new") || v.includes("unused") || v.includes("created")) {
    return "Chưa dùng";
  }
  // default safest: not blocking user
  return "Chưa dùng";
};

const dtoToTicketItem = (dto: MyTicketDto): TicketItem => {
  const status = mapTicketStatus(dto.status);
  const ticketType = mapTicketType(dto.ticketTypeId);
  const displayId = dto.code ? `#${dto.code}` : `#${dto.id}`;

  return {
    id: displayId,
    rawId: dto.id,
    status,
    ticketType,
    route: "--",
    validFrom: formatShortDate(dto.validFrom),
    validTo: formatShortDate(dto.validTo),
    active: status !== "Hết hạn",
  };
};

const secondsUntil = (iso?: string) => {
  if (!iso) return 0;
  const target = new Date(iso).getTime();
  if (Number.isNaN(target)) return 0;
  return Math.max(0, Math.floor((target - Date.now()) / 1000));
};

const navItems = [
  { label: "Dashboard", active: false, href: "/passenger-page", icon: LayoutDashboard },
  { label: "Mua vé", active: false, href: "/passenger-page/buy-tickets-step-1", icon: Ticket },
  { label: "Vé của tôi", active: true, href: "/passenger-page/my-tickets", icon: QrCode },
  { label: "Lịch sử chuyến", active: false, href: "/passenger-page/history", icon: History },
  { label: "Lịch tàu", active: false, href: "/passenger-page/schedule", icon: TrainFront },
  { label: "Tài khoản", active: false, href: "/passenger-page/account", icon: UserRound },
];

const statusStyle = {
  "Hoạt động": "bg-green-500/10 text-green-600",
  "Chưa dùng": "bg-amber-500/10 text-amber-600",
  "Hết hạn": "bg-red-500/10 text-red-600",
};

export default function MyTicketsPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tất cả");
  const [typeFilter, setTypeFilter] = useState("Tất cả");
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null);

  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [qrToken, setQrToken] = useState<QrTokenResult | null>(null);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [qrRemainingSeconds, setQrRemainingSeconds] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const data = await myTicketApi.list();
        const mapped = data.map(dtoToTicketItem);
        if (!cancelled) setTickets(mapped);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Không thể tải danh sách vé";
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

  useEffect(() => {
    if (!selectedTicket) {
      setQrToken(null);
      setQrImageUrl(null);
      setQrError(null);
      setQrRemainingSeconds(0);
      return;
    }

    let cancelled = false;

    const loadQr = async () => {
      setQrError(null);
      setQrToken(null);
      setQrImageUrl(null);

      try {
        const tokenRes = await myTicketApi.createQrToken(selectedTicket.rawId);
        if (cancelled) return;

        setQrToken(tokenRes);
        setQrRemainingSeconds(secondsUntil(tokenRes.expiresAt));

        const qrcode = await import("qrcode");
        const dataUrl = await qrcode.toDataURL(tokenRes.token, {
          margin: 1,
          width: 192,
        });
        if (!cancelled) setQrImageUrl(dataUrl);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Không thể tạo QR";
        if (!cancelled) setQrError(message);
      }
    };

    loadQr();

    return () => {
      cancelled = true;
    };
  }, [selectedTicket]);

  useEffect(() => {
    if (!selectedTicket || !qrToken?.expiresAt) {
      return;
    }

    setQrRemainingSeconds(secondsUntil(qrToken.expiresAt));
    const timer = window.setInterval(() => {
      setQrRemainingSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [qrToken?.expiresAt, selectedTicket]);

  const visibleTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const matchesQuery =
        query.length === 0 ||
        ticket.id.toLowerCase().includes(query.toLowerCase()) ||
        ticket.route.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === "Tất cả" || ticket.status === statusFilter;
      const matchesType =
        typeFilter === "Tất cả" ||
        (typeFilter === "Vé lượt" && ticket.ticketType === "Vé lượt") ||
        (typeFilter === "Vé tháng" && ticket.ticketType === "Vé tháng") ||
        (typeFilter === "Vé ngày" && ticket.ticketType === "Vé ngày");
      return matchesQuery && matchesStatus && matchesType;
    });
  }, [query, statusFilter, typeFilter]);

  return (
    <>
      <Head>
        <title>Vé của tôi | MetroNext</title>
      </Head>

      <div className="min-h-screen w-full bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_45%,#f8fafc_100%)]">
        <div className="flex min-h-screen w-full">
          <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
            <div className="flex items-center gap-3 p-6">
              <div className="flex h-8 w-8 items-center justify-center overflow-hidden">
                <BrandMark className="h-8 w-8" />
              </div>
              <Link href="/" className="text-xl font-bold leading-6 text-neutral-900">
                MetroNext
              </Link>
            </div>

            <nav className="flex-1 space-y-1 px-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition ${
                      item.active
                        ? "bg-blue-600/10 text-blue-600"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${item.active ? "text-blue-600" : "text-slate-500"}`} />
                    <span className={`text-sm ${item.active ? "font-semibold" : "font-medium"}`}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-slate-200 p-4">
              <div className="flex items-center gap-3 rounded-2xl p-2">
                <img
                  className="h-10 w-10 rounded-full object-cover"
                  src="https://placehold.co/40x40"
                  alt="Passenger avatar"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-neutral-900">Anh Yang Say Hi (Dzz)</p>
                  <p className="truncate text-xs text-slate-500">Hành khách Gold</p>
                </div>
              </div>
            </div>
          </aside>

          <main className="flex min-w-0 flex-1 flex-col">
            <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur sm:px-8">
              <div className="relative w-full max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full rounded-xl bg-slate-100 py-2.5 pl-10 pr-4 text-sm text-neutral-900 outline-none placeholder:text-slate-500"
                  placeholder="Tìm kiếm ga, vé, lịch trình..."
                  readOnly
                />
              </div>

              <div className="ml-4 flex items-center gap-4">
                <button className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <Bell className="h-5 w-5" />
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-red-500" />
                </button>
                <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <Settings className="h-5 w-5" />
                </button>
              </div>
            </header>

            <section className="flex-1 p-4 sm:p-8">
              <div className="mx-auto w-full max-w-[1320px] space-y-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                    <span>Hành khách</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                    <span className="text-slate-900">Vé của tôi</span>
                  </div>
                  <h1 className="text-4xl font-black leading-10 text-slate-900">Vé của tôi</h1>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Tổng số vé</p>
                    <p className="mt-2 text-3xl font-black text-slate-900">12</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Đang hoạt động</p>
                    <p className="mt-2 text-3xl font-black text-green-600">4</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Chưa dùng</p>
                    <p className="mt-2 text-3xl font-black text-amber-600">3</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Hết hạn</p>
                    <p className="mt-2 text-3xl font-black text-red-600">5</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_160px_160px_minmax(0,1fr)_auto]">
                    <div className="space-y-1">
                      <p className="px-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">Mã vé</p>
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          value={query}
                          onChange={(event) => setQuery(event.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none placeholder:text-slate-500"
                          placeholder="Tìm mã vé (#MNX...)"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="px-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">Trạng thái</p>
                      <div className="relative">
                        <select
                          value={statusFilter}
                          onChange={(event) => setStatusFilter(event.target.value)}
                          className="h-9 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none"
                        >
                          <option>Tất cả</option>
                          <option>Hoạt động</option>
                          <option>Chưa dùng</option>
                          <option>Hết hạn</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="px-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">Loại vé</p>
                      <div className="relative">
                        <select
                          value={typeFilter}
                          onChange={(event) => setTypeFilter(event.target.value)}
                          className="h-9 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none"
                        >
                          <option>Tất cả</option>
                          <option>Vé lượt</option>
                          <option>Vé ngày</option>
                          <option>Vé tháng</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="px-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">Thời gian</p>
                      <div className="relative">
                        <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none placeholder:text-slate-500"
                          placeholder="Thời gian (Từ ngày - Đến ngày)"
                          readOnly
                        />
                      </div>
                    </div>

                    <div className="flex items-end">
                      <button
                        onClick={() => {
                          setQuery("");
                          setStatusFilter("Tất cả");
                          setTypeFilter("Tất cả");
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Đặt lại
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                  {loadError ? (
                    <div className="sm:col-span-2 xl:col-span-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                      {loadError}
                    </div>
                  ) : null}

                  {isLoading ? (
                    <div className="sm:col-span-2 xl:col-span-4 rounded-xl border border-slate-200 bg-white px-4 py-6 text-center text-sm font-semibold text-slate-600">
                      Đang tải vé...
                    </div>
                  ) : null}

                  {visibleTickets.map((ticket) => (
                    <article
                      key={ticket.id}
                      className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] transition hover:-translate-y-0.5 hover:shadow-md ${
                        ticket.active ? "" : "opacity-70"
                      }`}
                    >
                      <div
                        className={`h-1.5 ${
                          ticket.status === "Hoạt động"
                            ? "bg-green-500"
                            : ticket.status === "Chưa dùng"
                              ? "bg-amber-500"
                              : "bg-red-500"
                        }`}
                      />
                      <div className="space-y-4 p-5">
                        <div className="flex items-start justify-between">
                          <span className="text-xs font-bold tracking-wide text-slate-400">{ticket.id}</span>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${statusStyle[ticket.status]}`}
                          >
                            {ticket.status}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Ticket className={`h-3.5 w-3.5 ${ticket.active ? "text-blue-600" : "text-slate-400"}`} />
                            <h3 className="text-base font-bold text-slate-900">{ticket.ticketType}</h3>
                          </div>
                          <p className="text-sm text-slate-600">{ticket.route}</p>
                        </div>

                        <div className="space-y-1 border-t border-slate-100 pt-2">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Hiệu lực</p>
                          <p className="text-sm font-medium text-slate-900">
                            {ticket.validFrom} - {ticket.validTo}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 bg-slate-50 p-4">
                        {ticket.active ? (
                          <button
                            onClick={() => setSelectedTicket(ticket)}
                            className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-blue-600 py-2 text-xs font-bold text-white hover:bg-blue-700"
                          >
                            <QrCode className="h-3.5 w-3.5" />
                            Hiển thị QR
                          </button>
                        ) : (
                          <button className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-slate-200 py-2 text-xs font-bold text-slate-500">
                            <CircleAlert className="h-3.5 w-3.5" />
                            Vô hiệu
                          </button>
                        )}

                        <button className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-white">
                          Chi tiết
                        </button>
                      </div>
                    </article>
                  ))}
                </div>

                {visibleTickets.length === 0 && (
                  <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
                    <CircleAlert className="mx-auto h-10 w-10 text-slate-300" />
                    <p className="mt-2 text-sm font-medium text-slate-500">Không tìm thấy vé phù hợp bộ lọc</p>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <p className="text-sm text-slate-500">
                    Hiển thị <span className="font-bold">{visibleTickets.length}</span> trên <span className="font-bold">{tickets.length}</span> vé
                  </p>

                  <div className="flex gap-2">
                    <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900">
                      Trước
                    </button>
                    <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900">
                      Tiếp
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>

      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <h3 className="text-lg font-bold text-slate-900">Mã QR Vào cổng</h3>
              <button
                onClick={() => setSelectedTicket(null)}
                className="flex h-6 w-6 items-center justify-center rounded-2xl text-slate-400"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-6 px-8 py-8">
              <div className="mx-auto w-fit rounded-xl border border-slate-200 bg-white p-4 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
                <img
                  src={qrImageUrl ?? "https://placehold.co/192x192?text=QR+Loading"}
                  className="h-48 w-48"
                  alt={qrImageUrl ? "Ticket QR" : "Đang tải QR"}
                />
              </div>

              {qrError ? (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-center text-sm font-bold text-red-600">
                  {qrError}
                </div>
              ) : null}

              <div className="space-y-1 text-center">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Mã vé của bạn</p>
                <p className="text-2xl font-black text-blue-600">{selectedTicket.id}</p>
              </div>

              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-center text-sm font-bold text-red-600">
                Mã sẽ hết hạn sau: {String(Math.floor(qrRemainingSeconds / 60)).padStart(2, "0")}:{String(qrRemainingSeconds % 60).padStart(2, "0")}
              </div>

              <p className="text-center text-sm leading-6 text-slate-500">
                Đưa mã này vào máy quét tại cổng để vào
                <br />
                ga
              </p>
            </div>

            <div className="border-t border-slate-100 bg-slate-50 px-6 py-5">
              <button
                onClick={() => setSelectedTicket(null)}
                className="w-full rounded-xl bg-blue-600 py-3 text-base font-bold text-white shadow-[0px_10px_15px_-3px_rgba(19,127,236,0.20)]"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
