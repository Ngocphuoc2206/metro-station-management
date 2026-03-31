import Head from "next/head";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Circle,
  Download,
  History,
  LayoutDashboard,
  MapPin,
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

type HistoryRow = {
  date: string;
  from: string;
  inTime: string;
  to: string;
  outTime: string;
  price: string;
  status: string;
};

const rows: HistoryRow[] = [
  {
    date: "12/10/2023",
    from: "Bến Thành",
    inTime: "08:30:12",
    to: "Suối Tiên",
    outTime: "09:15:45",
    price: "15.000đ",
    status: "Thành công",
  },
  {
    date: "11/10/2023",
    from: "Ga Văn Thánh",
    inTime: "17:45:20",
    to: "Bến Thành",
    outTime: "18:10:05",
    price: "12.000đ",
    status: "Thành công",
  },
  {
    date: "11/10/2023",
    from: "Bến Thành",
    inTime: "07:15:55",
    to: "Ga Văn Thánh",
    outTime: "07:40:30",
    price: "12.000đ",
    status: "Thành công",
  },
  {
    date: "10/10/2023",
    from: "Suối Tiên",
    inTime: "18:30:12",
    to: "Bến Thành",
    outTime: "19:20:11",
    price: "15.000đ",
    status: "Thành công",
  },
  {
    date: "09/10/2023",
    from: "Bến Thành",
    inTime: "08:05:44",
    to: "Ga Ba Son",
    outTime: "08:15:30",
    price: "9.000đ",
    status: "Thành công",
  },
];

const navItems = [
  { label: "Dashboard", active: false, href: "/passenger-page", icon: LayoutDashboard },
  { label: "Mua vé", active: false, href: "/metro/buy-tickets-step-1", icon: Ticket },
  { label: "Vé của tôi", active: false, href: "/passenger-page/my-tickets", icon: Ticket },
  { label: "Lịch sử chuyến", active: true, href: "/passenger-page/history", icon: History },
  { label: "Lịch tàu", active: false, href: "/passenger-page/schedule", icon: TrainFront },
  { label: "Tài khoản", active: false, href: "/passenger-page/account", icon: UserRound },
];

export default function PassengerHistoryPage() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const selectedTrip = useMemo(
    () => (selectedIndex === null ? null : rows[selectedIndex]),
    [selectedIndex],
  );

  const baseFare = useMemo(() => {
    if (!selectedTrip) return 0;
    const rawPrice = Number(selectedTrip.price.replace(/\D/g, ""));
    const peakSurcharge = selectedTrip.inTime >= "07:00:00" && selectedTrip.inTime <= "09:30:00" ? 3000 : 0;
    return Math.max(rawPrice - peakSurcharge, 0);
  }, [selectedTrip]);

  const peakSurcharge = useMemo(() => {
    if (!selectedTrip) return 0;
    return selectedTrip.inTime >= "07:00:00" && selectedTrip.inTime <= "09:30:00" ? 3000 : 0;
  }, [selectedTrip]);

  const formatPrice = (value: number) => `${value.toLocaleString("vi-VN")}đ`;

  return (
    <>
      <Head>
        <title>Lịch sử chuyến | MetroNext</title>
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
              <div className="space-y-6">
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <div className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-500">
                        <span>Hành khách</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                        <span className="text-neutral-900">Lịch sử chuyến</span>
                      </div>
                      <h1 className="text-4xl font-black leading-10 text-slate-900">Lịch sử chuyến</h1>
                    </div>

                    <button className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-[0px_10px_15px_-3px_rgba(19,127,236,0.20)]">
                      <Download className="h-4 w-4" />
                      Xuất CSV
                    </button>
                  </div>

                  <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-4 lg:grid-cols-[1.3fr_1fr_1fr_auto]">
                    <div className="space-y-1.5">
                      <p className="pl-1 text-xs font-bold uppercase text-slate-500">Khoảng thời gian</p>
                      <div className="relative">
                        <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <button className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-left text-sm text-slate-900">
                          01/10/2023 - 15/10/2023
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <p className="pl-1 text-xs font-bold uppercase text-slate-500">Ga</p>
                      <button className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900">
                        Tất cả các ga
                        <ChevronDown className="h-4 w-4 text-slate-500" />
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <p className="pl-1 text-xs font-bold uppercase text-slate-500">Trạng thái</p>
                      <button className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900">
                        Tất cả
                        <ChevronDown className="h-4 w-4 text-slate-500" />
                      </button>
                    </div>

                    <div className="flex items-end">
                      <button className="px-4 py-2 text-sm font-bold text-slate-500">Đặt lại</button>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
                    <div className="overflow-x-auto">
                      <div className="min-w-[956px]">
                        <div className="grid grid-cols-[144px_160px_112px_160px_112px_112px_160px] bg-slate-50 text-xs font-bold uppercase text-slate-500">
                          <div className="px-6 py-4">Ngày</div>
                          <div className="px-6 py-4">Ga vào</div>
                          <div className="px-6 py-4">Giờ vào</div>
                          <div className="px-6 py-4">Ga ra</div>
                          <div className="px-6 py-4">Giờ ra</div>
                          <div className="px-6 py-4">Giá vé</div>
                          <div className="px-6 py-4 text-right">Trạng thái</div>
                        </div>

                        {rows.map((row, index) => (
                          <div
                            key={`${row.date}-${row.inTime}`}
                            role="button"
                            tabIndex={0}
                            onClick={() => setSelectedIndex(index)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                setSelectedIndex(index);
                              }
                            }}
                            className={`grid grid-cols-[144px_160px_112px_160px_112px_112px_160px] text-sm ${
                              selectedIndex === index
                                ? "border-l-4 border-blue-600 bg-blue-600/5"
                                : "border-t border-slate-100 hover:bg-slate-50"
                            }`}
                          >
                            <div className="px-6 py-4 font-medium text-slate-900">{row.date}</div>
                            <div className="px-6 py-4 text-slate-900">{row.from}</div>
                            <div className="px-6 py-4 text-slate-500">{row.inTime}</div>
                            <div className="px-6 py-4 text-slate-900">{row.to}</div>
                            <div className="px-6 py-4 text-slate-500">{row.outTime}</div>
                            <div className="px-6 py-4 font-bold text-slate-900">{row.price}</div>
                            <div className="flex justify-end px-6 py-4">
                              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                {row.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <p className="text-sm font-medium text-slate-500">Hiển thị 1 - 5 của 48 chuyến đi</p>

                    <div className="flex items-center gap-2">
                      <button className="flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 opacity-50">
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button className="h-9 w-9 rounded-2xl bg-blue-600 text-sm font-medium text-white">1</button>
                      <button className="h-9 w-9 rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-900">2</button>
                      <button className="h-9 w-9 rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-900">3</button>
                      <span className="px-1 text-sm font-medium text-slate-400">...</span>
                      <button className="h-9 w-9 rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-900">10</button>
                      <button className="flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400">
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-3xl border border-blue-100 bg-gradient-to-b from-blue-50 to-white p-5">
                      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-600">
                        <History className="h-5 w-5" />
                      </div>
                      <h3 className="text-base font-black text-slate-900">Xem chi tiết chuyến đi</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        Bấm vào một dòng trong bảng lịch sử để mở Chi tiết chuyến đi bên phải màn hình.
                      </p>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-5">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Mẹo nhanh</p>
                      <ul className="mt-3 space-y-2 text-sm text-slate-600">
                        <li>- Dòng được chọn sẽ được tô nền xanh nhạt.</li>
                        <li>- Có thể đổi bộ lọc theo ga hoặc thời gian để tìm chuyến nhanh hơn.</li>
                        <li>- Dùng Xuất CSV để tải danh sách đang hiển thị.</li>
                      </ul>
                    </div>
                  </div>
              </div>

              {selectedTrip && (
                <>
                  <button
                    aria-label="Đóng chi tiết chuyến"
                    onClick={() => setSelectedIndex(null)}
                    className="fixed inset-0 z-40 bg-slate-900/30"
                  />

                  <aside className="fixed bottom-0 right-0 top-0 z-50 w-full max-w-md overflow-hidden border-l border-slate-200 bg-white shadow-2xl md:top-16">
                    <div className="flex h-full flex-col">
                      <div className="flex items-center justify-between border-b border-slate-100 p-6">
                        <h3 className="text-xl font-black text-slate-900">Chi tiết chuyến đi</h3>
                        <button
                          className="flex h-8 w-8 items-center justify-center rounded-2xl text-slate-400"
                          onClick={() => setSelectedIndex(null)}
                          aria-label="Đóng chi tiết chuyến"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex-1 space-y-6 overflow-y-auto p-6">
                        <div className="relative h-44 overflow-hidden rounded-3xl border border-slate-200 bg-slate-100">
                          <img
                            src="https://placehold.co/390x176"
                            alt="Trip mini map"
                            className="h-full w-full object-cover"
                          />
                          <span className="absolute left-4 top-3 rounded-md border border-slate-200 bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-900 backdrop-blur-sm">
                            Tuyến số 1
                          </span>
                          <span className="absolute left-24 top-[78px] h-4 w-4 rounded-full border-2 border-white bg-blue-600 shadow-lg" />
                          <span className="absolute right-24 top-[52px] h-4 w-4 rounded-full border-2 border-white bg-green-500 shadow-lg" />
                        </div>

                        <div className="flex gap-4 rounded-3xl border border-slate-100 bg-slate-50 p-4">
                          <div className="flex flex-col items-center">
                            <MapPin className="h-4 w-4 text-blue-600" />
                            <span className="my-1 h-6 w-px border-l border-slate-300" />
                            <MapPin className="h-4 w-4 text-green-500" />
                          </div>

                          <div className="flex-1 space-y-4">
                            <div>
                              <p className="text-[10px] font-bold uppercase text-slate-500">Ga vào</p>
                              <p className="text-sm font-bold text-slate-900">{selectedTrip.from}</p>
                              <p className="text-xs text-slate-500">
                                {selectedTrip.date} • {selectedTrip.inTime.slice(0, 5)}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold uppercase text-slate-500">Ga ra</p>
                              <p className="text-sm font-bold text-slate-900">{selectedTrip.to}</p>
                              <p className="text-xs text-slate-500">
                                {selectedTrip.date} • {selectedTrip.outTime.slice(0, 5)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3 rounded-3xl bg-slate-900 p-5 text-white">
                          <div className="flex items-center justify-between text-xs font-medium text-white/70">
                            <span>Chi phí cơ bản</span>
                            <span>{formatPrice(baseFare)}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs font-medium text-white/70">
                            <span>Phụ phí giờ cao điểm</span>
                            <span>{formatPrice(peakSurcharge)}</span>
                          </div>
                          <div className="flex items-center justify-between border-t border-white/10 pt-2">
                            <span className="text-sm font-bold">Tổng thanh toán</span>
                            <span className="text-xl font-black">{selectedTrip.price}</span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <p className="px-1 text-xs font-bold uppercase tracking-wide text-slate-500">Thông tin vé</p>
                          <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="flex items-center gap-3">
                              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-600">
                                <Ticket className="h-5 w-5" />
                              </span>
                              <div>
                                <p className="text-sm font-bold text-slate-900">Vé Lượt (Mã #MNX-2938)</p>
                                <p className="text-xs text-slate-500">Đã sử dụng ngày {selectedTrip.date}</p>
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-400" />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <p className="px-1 text-xs font-bold uppercase tracking-wide text-slate-500">
                            Thông tin cổng (Gate)
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                              <p className="text-[10px] font-bold uppercase text-slate-400">Cổng vào</p>
                              <p className="text-lg font-black text-slate-700">G-02A</p>
                            </div>
                            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                              <p className="text-[10px] font-bold uppercase text-slate-400">Cổng ra</p>
                              <p className="text-lg font-black text-slate-700">G-14C</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 p-6">
                        <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 py-3 text-sm font-bold text-slate-700">
                          <Circle className="h-3 w-3 fill-current" />
                          Khiếu nại chuyến đi này
                        </button>
                      </div>
                    </div>
                  </aside>
                </>
              )}
            </section>
          </main>
        </div>
      </div>
    </>
  );
}
