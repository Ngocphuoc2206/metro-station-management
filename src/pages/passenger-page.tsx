import Head from "next/head";
import Link from "next/link";
import {
  Bell,
  CalendarClock,
  ChevronRight,
  CreditCard,
  History,
  LayoutDashboard,
  MapPinned,
  Plus,
  QrCode,
  Search,
  Settings,
  Ticket,
  TrainFront,
  UserRound,
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

type StatCard = {
  label: string;
  value: string;
  tone: "green" | "blue" | "amber" | "red";
  subLabel?: string;
};

type TicketCard = {
  status: "Hoạt động" | "Chưa dùng" | "Hết hạn";
  code: string;
  type: string;
  route: string;
  tone: "green" | "amber" | "red";
  disabled?: boolean;
};

const stats: StatCard[] = [
  { label: "Vé đang hoạt động", value: "2", tone: "green" },
  { label: "Tổng chuyến tháng này", value: "48", tone: "blue" },
  { label: "Chi phí tháng này", value: "320.000đ", tone: "amber" },
  { label: "Thông báo", value: "3", subLabel: "mới", tone: "red" },
];

const statIcons = {
  green: Ticket,
  blue: TrainFront,
  amber: CreditCard,
  red: Bell,
};

const recentTickets: TicketCard[] = [
  {
    status: "Hoạt động",
    code: "#MNX-2938",
    type: "Vé Lượt",
    route: "Bến Thành → Suối Tiên",
    tone: "green",
  },
  {
    status: "Chưa dùng",
    code: "#MNX-3102",
    type: "Vé Lượt",
    route: "Ga Ba Son → Ga Văn Thánh",
    tone: "amber",
  },
  {
    status: "Hết hạn",
    code: "#MNX-1823",
    type: "Vé Ngày",
    route: "Toàn hệ thống Metro",
    tone: "red",
    disabled: true,
  },
];

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

const navItems = [
  { label: "Dashboard", active: true, href: "/passenger-page", icon: LayoutDashboard },
  { label: "Mua vé", active: false, href: "/metro/buy-tickets-step-1", icon: Ticket },
  { label: "Vé của tôi", active: false, href: "#", icon: QrCode },
  { label: "Lịch sử chuyến", active: false, href: "/passenger-page/history", icon: History },
  { label: "Lịch tàu", active: false, href: "#", icon: TrainFront },
  { label: "Tài khoản", active: false, href: "#", icon: UserRound },
];

const tableRows = [
  {
    date: "12/10/2023, 08:30",
    from: "Bến Thành",
    to: "Suối Tiên",
    fare: "15.000đ",
  },
  {
    date: "11/10/2023, 17:45",
    from: "Ga Văn Thánh",
    to: "Bến Thành",
    fare: "12.000đ",
  },
  {
    date: "11/10/2023, 07:15",
    from: "Bến Thành",
    to: "Ga Văn Thánh",
    fare: "12.000đ",
  },
];

export default function PassengerPage() {
  return (
    <>
      <Head>
        <title>Passenger Page | MetroNext</title>
      </Head>

      <div className="min-h-screen w-full bg-neutral-100">
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
                    <span className={`text-sm ${item.active ? "font-semibold" : "font-medium"}`}>{item.label}</span>
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
            <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-8">
              <div className="relative w-full max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full rounded-2xl bg-slate-100 py-2.5 pl-10 pr-4 text-sm text-neutral-900 outline-none placeholder:text-slate-500"
                  placeholder="Tìm kiếm ga, vé, lịch trình..."
                  readOnly
                />
              </div>

              <div className="ml-4 flex items-center gap-4">
                <button className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                  <Bell className="h-5 w-5" />
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-red-500" />
                </button>
                <button className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                  <Settings className="h-5 w-5" />
                </button>
              </div>
            </header>

            <section className="flex-1 p-4 sm:p-8">
              <div className="space-y-8">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <div className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-500">
                      <span>Hành khách</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                      <span className="text-neutral-900">Dashboard</span>
                    </div>
                    <h1 className="text-4xl font-black leading-10 text-neutral-900">Tổng quan</h1>
                  </div>

                  <button className="relative inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-[0px_10px_15px_-3px_rgba(19,127,236,0.20)]">
                    <Plus className="h-4 w-4" />
                    <span>Mua vé ngay</span>
                  </button>
                </div>

                <div className="grid gap-6 lg:grid-cols-4">
                  {stats.map((stat) => {
                    const StatIcon = statIcons[stat.tone];
                    return (
                      <article
                        key={stat.label}
                        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
                      >
                        <div className={`mb-6 inline-flex rounded-2xl p-2 ${toneClass[stat.tone].icon}`}>
                          <StatIcon className="h-5 w-5" />
                        </div>
                        <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                        <div className="mt-1 flex items-end gap-2">
                          <p className="text-3xl font-black leading-9 text-slate-900">{stat.value}</p>
                          {stat.subLabel ? <span className="text-sm font-bold text-red-600">{stat.subLabel}</span> : null}
                        </div>
                      </article>
                    );
                  })}
                </div>

                <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_288px]">
                  <div className="space-y-8">
                    <section>
                      <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-slate-900">Vé gần đây</h2>
                        <Link href="/passenger-page/recent-tickets" className="text-sm font-semibold text-blue-600">
                          Xem tất cả
                        </Link>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                        {recentTickets.map((ticket) => (
                          <article
                            key={ticket.code}
                            className={`rounded-3xl border border-slate-200 border-t-4 bg-white p-5 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] ${
                              toneClass[ticket.tone].border
                            } ${ticket.disabled ? "opacity-75" : ""}`}
                          >
                            <div className="mb-4 flex items-start justify-between">
                              <span className={`rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${toneClass[ticket.tone].badge}`}>
                                {ticket.status}
                              </span>
                              <span className="text-xs font-medium text-slate-400">{ticket.code}</span>
                            </div>

                            <p className="text-xs font-bold uppercase tracking-tight text-slate-500">{ticket.type}</p>
                            <p className="mb-4 text-base font-bold leading-6 text-slate-900">{ticket.route}</p>

                            <button
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
                        <h2 className="text-xl font-bold text-neutral-900">Chuyến gần nhất</h2>
                        <button className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900">
                          <CalendarClock className="h-3.5 w-3.5" />
                          Tháng này
                        </button>
                      </div>

                      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
                        <div className="overflow-x-auto">
                          <div className="min-w-[720px]">
                            <div className="grid grid-cols-5 bg-slate-50 text-xs font-bold uppercase text-slate-500">
                              <div className="px-6 py-4">Ngày</div>
                              <div className="px-6 py-4">Ga vào</div>
                              <div className="px-6 py-4">Ga ra</div>
                              <div className="px-6 py-4">Giá vé</div>
                              <div className="px-6 py-4">Trạng thái</div>
                            </div>

                            {tableRows.map((row, index) => (
                              <div
                                key={row.date + row.from}
                                className={`grid grid-cols-5 text-sm text-slate-900 ${index > 0 ? "border-t border-slate-100" : ""}`}
                              >
                                <div className="px-6 py-4 font-medium">{row.date}</div>
                                <div className="px-6 py-4">{row.from}</div>
                                <div className="px-6 py-4">{row.to}</div>
                                <div className="px-6 py-4 font-bold">{row.fare}</div>
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
                    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
                      <h3 className="mb-6 text-lg font-bold text-slate-900">Thao tác nhanh</h3>
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

                        <button className="flex w-full items-center justify-between rounded-3xl bg-slate-100 p-4 text-slate-700">
                          <div className="flex items-center gap-3">
                            <TrainFront className="h-5 w-5" />
                            <span className="text-base font-bold">Xem lịch tàu</span>
                          </div>
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </section>

                    <section className="relative h-48 overflow-hidden rounded-3xl border border-slate-200 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
                      <img
                        src="https://placehold.co/295x190"
                        alt="Metro map"
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-black/0" />
                      <div className="absolute inset-x-4 bottom-4 text-white">
                        <p className="text-xs font-bold uppercase tracking-wider text-white/80">Trạng thái hệ thống</p>
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
            </section>
          </main>
        </div>
      </div>
    </>
  );
}
