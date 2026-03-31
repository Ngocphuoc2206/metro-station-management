import Head from "next/head";
import Link from "next/link";
import {
  Bell,
  ChevronRight,
  CircleAlert,
  History,
  LayoutDashboard,
  Map,
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

const navItems = [
  { label: "Dashboard", active: false, href: "/passenger-page", icon: LayoutDashboard },
  { label: "Mua vé", active: false, href: "/metro/buy-tickets-step-1" },
  { label: "Vé của tôi", active: false, href: "#", icon: QrCode },
  { label: "Lịch sử chuyến", active: false, href: "/passenger-page/history", icon: History },
  { label: "Lịch tàu", active: false, href: "#", icon: TrainFront },
  { label: "Tài khoản", active: false, href: "#", icon: UserRound },
];

export default function RecentTicketsPage() {
  return (
    <>
      <Head>
        <title>Vé gần đây | MetroNext</title>
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
                const Icon = item.icon ?? Ticket;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition ${
                      item.active ? "bg-blue-600/10 text-blue-600" : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
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
                  <div className="min-w-[280px]">
                    <div className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-500">
                      <span>Hành khách</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                      <span className="text-neutral-900">Vé gần đây</span>
                    </div>
                    <h1 className="text-3xl font-black leading-9 text-neutral-900">Bảng điều khiển</h1>
                    <p className="mt-1 text-base text-slate-500">
                      Chào mừng bạn trở lại với MetroNext. Hãy lên kế hoạch cho chuyến đi của bạn.
                    </p>
                  </div>

                  <Link
                    href="/metro/buy-tickets-step-1"
                    className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Mua vé mới
                  </Link>
                </div>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_288px]">
                  <div className="space-y-6">
                    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
                      <div className="border-b border-slate-100 px-6 pb-4 pt-3.5">
                        <h2 className="text-lg font-bold text-neutral-900">Vé gần đây</h2>
                      </div>

                      <div className="flex flex-col items-center px-6 py-16 text-center">
                        <div className="mb-8 w-full max-w-72">
                          <div className="relative flex justify-center rounded-full bg-slate-50 py-24">
                            <Ticket className="h-16 w-20 text-blue-600/30" />
                            <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-br from-blue-600/5 to-blue-600/0" />
                          </div>
                        </div>

                        <h3 className="text-xl font-bold text-neutral-900">Bạn chưa có vé nào</h3>
                        <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                          Bạn chưa thực hiện bất kỳ giao dịch mua vé nào. Hãy bắt đầu hành trình đầu tiên của
                          bạn cùng MetroNext ngay hôm nay.
                        </p>

                        <Link
                          href="/metro/buy-tickets-step-1"
                          className="mt-8 inline-flex h-11 min-w-36 items-center justify-center rounded-2xl bg-blue-600 px-6 text-sm font-bold tracking-tight text-white"
                        >
                          Mua vé ngay
                        </Link>
                      </div>
                    </section>

                    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
                      <div className="flex items-center justify-between border-b border-slate-100 px-6 pb-4 pt-3.5">
                        <h2 className="text-lg font-bold text-neutral-900">Lịch sử chuyến đi</h2>
                        <Link href="/passenger-page/history" className="text-sm font-medium text-blue-600">
                          Xem tất cả
                        </Link>
                      </div>

                      <div className="overflow-hidden pb-12">
                        <div className="overflow-x-auto">
                          <div className="min-w-[680px] border-b border-slate-100 bg-slate-50">
                            <div className="grid grid-cols-[128px_1fr_144px_176px] text-xs font-semibold uppercase text-slate-500">
                              <div className="px-6 py-3">Mã vé</div>
                              <div className="px-6 py-3">Tuyến đường</div>
                              <div className="px-6 py-3">Ngày đi</div>
                              <div className="px-6 py-3">Trạng thái</div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-center gap-2 py-12">
                          <CircleAlert className="h-10 w-10 text-slate-300" />
                          <p className="text-sm font-medium text-slate-500">Không tìm thấy dữ liệu</p>
                        </div>
                      </div>
                    </section>
                  </div>

                  <aside className="space-y-6">
                    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
                      <h3 className="text-base font-bold text-slate-900">Tổng quan của bạn</h3>

                      <div className="mt-4 space-y-4">
                        <div className="rounded-2xl bg-neutral-100 p-4">
                          <p className="text-xs font-medium uppercase text-slate-500">Số dư ví</p>
                          <p className="mt-1 text-2xl font-black text-slate-900">0 VND</p>
                        </div>

                        <div className="rounded-2xl bg-neutral-100 p-4">
                          <p className="text-xs font-medium uppercase text-slate-500">Điểm thưởng</p>
                          <p className="mt-1 text-2xl font-black text-slate-900">0 pts</p>
                        </div>

                        <button className="w-full rounded-2xl bg-slate-100 py-3 text-sm font-bold text-slate-900">
                          Nạp tiền vào ví
                        </button>
                      </div>
                    </section>

                    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
                      <h3 className="text-base font-bold text-slate-900">Trạng thái hệ thống</h3>

                      <div className="mt-4 space-y-4">
                        <div className="flex items-center gap-3">
                          <span className="h-2 w-2 rounded-full bg-green-500 shadow-[0px_0px_8px_0px_rgba(34,197,94,0.60)]" />
                          <p className="text-sm font-medium text-neutral-900">Tuyến Metro #1: Hoạt động</p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="h-2 w-2 rounded-full bg-green-500 shadow-[0px_0px_8px_0px_rgba(34,197,94,0.60)]" />
                          <p className="text-sm font-medium text-neutral-900">Tuyến Metro #2: Hoạt động</p>
                        </div>

                        <div className="h-px bg-slate-100" />

                        <p className="text-xs text-slate-500">Cập nhật lúc: 14:30 Hôm nay</p>
                      </div>
                    </section>

                    <section className="relative h-48 overflow-hidden rounded-3xl bg-slate-200">
                      <div className="absolute inset-0 bg-white" />
                      <div className="absolute inset-0 bg-blue-600/10 p-6">
                        <div className="mx-auto mt-12 w-fit rounded-2xl bg-white/90 p-3 shadow-lg">
                          <div className="flex flex-col items-center">
                            <Map className="h-5 w-5 text-slate-700" />
                            <p className="mt-1 text-xs font-bold text-slate-900">Bản đồ tuyến đường</p>
                            <p className="text-[10px] text-slate-500">Bấm để phóng to</p>
                          </div>
                        </div>
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
