import Head from "next/head";
import Link from "next/link";
import {
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock3,
  History,
  LayoutDashboard,
  MapPinned,
  Search,
  Settings,
  SlidersHorizontal,
  Ticket,
  TrainFront,
  TrainTrack,
  TriangleAlert,
  UserRound,
  Wrench,
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

type ScheduleRow = {
  eta: string;
  departure: string;
  direction: string;
  status: "Đúng giờ" | "Trễ (6 phút)";
};

const navItems = [
  { label: "Dashboard", active: false, href: "/passenger-page", icon: LayoutDashboard },
  { label: "Mua vé", active: false, href: "/passenger-page/buy-tickets-step-1", icon: Ticket },
  { label: "Vé của tôi", active: false, href: "/passenger-page/my-tickets", icon: Ticket },
  { label: "Lịch sử chuyến", active: false, href: "/passenger-page/history", icon: History },
  { label: "Lịch tàu", active: true, href: "/passenger-page/schedule", icon: TrainFront },
  { label: "Tài khoản", active: false, href: "/passenger-page/account", icon: UserRound },
];

const scheduleRows: ScheduleRow[] = [
  { eta: "08:12", departure: "08:15", direction: "Bến Thành → Suối Tiên", status: "Đúng giờ" },
  { eta: "08:24", departure: "08:27", direction: "Bến Thành → Suối Tiên", status: "Đúng giờ" },
  { eta: "08:36", departure: "08:42", direction: "Bến Thành → Suối Tiên", status: "Trễ (6 phút)" },
  { eta: "08:48", departure: "08:51", direction: "Bến Thành → Suối Tiên", status: "Đúng giờ" },
  { eta: "09:00", departure: "09:03", direction: "Bến Thành → Suối Tiên", status: "Đúng giờ" },
];

const summaryCards = [
  { label: "Tần suất trung bình", value: "12 phút/chuyến", tone: "text-blue-600" },
  { label: "Chuyến đúng giờ", value: "96%", tone: "text-emerald-600" },
  { label: "Đang theo dõi", value: "12 đoàn tàu", tone: "text-slate-900" },
];

export default function PassengerSchedulePage() {
  return (
    <>
      <Head>
        <title>Lịch tàu | MetroNext</title>
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
                      item.active ? "bg-blue-600/10 text-blue-600" : "text-slate-700 hover:bg-slate-100"
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
            <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur sm:px-8">
              <div className="relative w-full max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full rounded-2xl bg-slate-100 py-2.5 pl-10 pr-4 text-sm text-neutral-900 outline-none placeholder:text-slate-500"
                  placeholder="Tìm kiếm ga, chuyến tàu..."
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
              <div className="mx-auto max-w-[1400px] space-y-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                    <span>Hành khách</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                    <span className="text-slate-900">Lịch tàu</span>
                  </div>
                  <h1 className="text-4xl font-black leading-10 text-slate-900">Lịch tàu</h1>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  {summaryCards.map((card) => (
                    <article
                      key={card.label}
                      className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm"
                    >
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{card.label}</p>
                      <p className={`mt-2 text-2xl font-black ${card.tone}`}>{card.value}</p>
                    </article>
                  ))}
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2 text-slate-900">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600">
                        <SlidersHorizontal className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold leading-5">Bộ lọc lịch tàu</p>
                        <p className="text-xs text-slate-500">Tùy chỉnh tuyến, ga và khung giờ bạn muốn theo dõi</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100">
                        Đặt lại
                      </button>
                      <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-600/20">
                        Áp dụng bộ lọc
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-[1.35fr_1fr_1fr_1.15fr]">
                    <label className="space-y-1.5">
                      <span className="px-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">Chọn tuyến</span>
                      <button className="group flex h-11 w-full min-w-0 items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-left text-sm text-slate-900 transition hover:border-blue-200 hover:bg-blue-50/40">
                        <span className="flex min-w-0 items-center gap-2">
                          <TrainTrack className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-blue-600" />
                          <span className="min-w-0 truncate" title="Tuyến số 1 (Bến Thành - Suối Tiên)">
                            Tuyến số 1 (Bến Thành - Suối Tiên)
                          </span>
                        </span>
                        <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
                      </button>
                    </label>

                    <label className="space-y-1.5">
                      <span className="px-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">Chọn ga</span>
                      <button className="group flex h-11 w-full min-w-0 items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-left text-sm text-slate-900 transition hover:border-blue-200 hover:bg-blue-50/40">
                        <span className="min-w-0 truncate">Ga Bến Thành</span>
                        <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
                      </button>
                    </label>

                    <label className="space-y-1.5">
                      <span className="px-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">Khung giờ</span>
                      <button className="group flex h-11 w-full min-w-0 items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-left text-sm text-slate-900 transition hover:border-blue-200 hover:bg-blue-50/40">
                        <span className="min-w-0 truncate">Tất cả khung giờ</span>
                        <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
                      </button>
                    </label>

                    <label className="space-y-1.5">
                      <span className="px-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">Ngày</span>
                      <button className="group flex h-11 w-full min-w-0 items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-left text-sm text-slate-900 transition hover:border-blue-200 hover:bg-blue-50/40">
                        <span className="flex min-w-0 items-center gap-2">
                          <CalendarDays className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-blue-600" />
                          <span className="min-w-0 truncate" title="Ngày trong tuần (Thứ 2 - Thứ 6)">
                            Ngày trong tuần (Thứ 2 - Thứ 6)
                          </span>
                        </span>
                        <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
                      </button>
                    </label>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Nhanh:</span>
                    <button className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                      Giờ cao điểm
                    </button>
                    <button className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
                      Trạng thái trễ
                    </button>
                    <button className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
                      Sắp đến
                    </button>
                  </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
                  <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                      <h2 className="text-lg font-bold text-slate-900">Lịch tàu theo thời gian thực</h2>
                      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Ga Bến Thành</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-left">
                        <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase text-slate-500">
                          <tr>
                            <th className="px-6 py-4">Giờ đến dự kiến</th>
                            <th className="px-6 py-4">Giờ khởi hành</th>
                            <th className="px-6 py-4">Hướng đi</th>
                            <th className="px-6 py-4 text-right">Tình trạng</th>
                          </tr>
                        </thead>
                        <tbody>
                          {scheduleRows.map((row) => (
                            <tr
                              key={`${row.eta}-${row.departure}`}
                              className={`border-t border-slate-100 transition-colors hover:bg-blue-50/40 ${
                                row.status.includes("Trễ") ? "bg-red-50/30" : "bg-white"
                              }`}
                            >
                              <td
                                className={`px-6 py-4 text-sm font-bold ${
                                  row.status.includes("Trễ") ? "text-red-600" : "text-blue-600"
                                }`}
                              >
                                {row.eta}
                              </td>
                              <td className="px-6 py-4 text-sm font-medium text-slate-900">{row.departure}</td>
                              <td className="px-6 py-4 text-sm text-slate-900">{row.direction}</td>
                              <td className="px-6 py-4 text-right">
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                                    row.status.includes("Trễ")
                                      ? "bg-red-100 text-red-700"
                                      : "bg-green-100 text-green-700"
                                  }`}
                                >
                                  <Circle
                                    className={`h-1.5 w-1.5 fill-current ${
                                      row.status.includes("Trễ") ? "text-red-500" : "text-green-500"
                                    }`}
                                  />
                                  {row.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex flex-col gap-6 xl:sticky xl:top-6 xl:self-start">
                    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                      <div className="flex items-center justify-between bg-blue-600 px-4 py-4 text-white">
                        <div className="flex items-center gap-2 text-base font-bold">
                          <Clock3 className="h-4 w-4" />
                          <span>Thông báo tuyến</span>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wide text-white/80">Thời gian thực</span>
                      </div>

                      <div className="space-y-3 p-4">
                        <article className="flex gap-3 rounded-2xl bg-slate-50 p-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10 text-green-600">
                            <TrainFront className="h-4 w-4" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-900">Tuyến 01 hoạt động ổn định</h3>
                            <p className="mt-1 text-xs leading-4 text-slate-500">
                              Cập nhật 2 phút trước. Không có gián đoạn nào được ghi nhận.
                            </p>
                          </div>
                        </article>

                        <article className="flex gap-3 rounded-2xl bg-slate-50 p-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
                            <Wrench className="h-4 w-4" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-900">Bảo trì thang cuốn Ga Ba Son</h3>
                            <p className="mt-1 text-xs leading-4 text-slate-500">
                              Thang cuốn hướng lối ra số 2 đang tạm ngưng để bảo trì định kỳ.
                            </p>
                          </div>
                        </article>

                        <article className="flex gap-3 rounded-2xl bg-slate-50 p-3 opacity-70">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 text-blue-600">
                            <TriangleAlert className="h-4 w-4" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-900">Cập nhật lịch chạy tàu Tết</h3>
                            <p className="mt-1 text-xs leading-4 text-slate-500">
                              Xem lịch trình điều chỉnh cho kỳ nghỉ lễ sắp tới tại đây.
                            </p>
                          </div>
                        </article>

                        <button className="w-full rounded-2xl border border-blue-600/20 py-2.5 text-xs font-bold text-blue-600">
                          Xem tất cả thông báo
                        </button>
                      </div>
                    </div>

                    <Link
                      href="/passenger-page/live-map"
                      className="relative block h-48 overflow-hidden rounded-3xl border border-slate-200 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <img
                        src="https://placehold.co/295x190"
                        alt="Bản đồ tàu"
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/25 to-black/0" />
                      <div className="absolute inset-0 flex items-end p-6 text-white">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-white/80">Xem bản đồ trực tuyến</p>
                          <h3 className="mt-1 text-lg font-bold">Vị trí tàu hiện tại</h3>
                          <div className="mt-2 flex items-center gap-2 text-xs font-medium">
                            <MapPinned className="h-3.5 w-3.5 text-blue-300" />
                            Đang theo dõi 12 đoàn tàu
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </>
  );
}
