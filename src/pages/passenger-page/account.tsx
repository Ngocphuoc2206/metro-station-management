import Head from "next/head";
import Link from "next/link";
import {
  Bell,
  Camera,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Globe,
  History,
  LayoutDashboard,
  Moon,
  Plus,
  QrCode,
  Search,
  Settings,
  Shield,
  Ticket,
  TrainFront,
  Trash2,
  User,
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
  { label: "Mua vé", active: false, href: "/metro/buy-tickets-step-1", icon: Ticket },
  { label: "Vé của tôi", active: false, href: "/passenger-page/my-tickets", icon: QrCode },
  { label: "Lịch sử chuyến", active: false, href: "/passenger-page/history", icon: History },
  { label: "Lịch tàu", active: false, href: "/passenger-page/schedule", icon: TrainFront },
  { label: "Tài khoản", active: true, href: "/passenger-page/account", icon: UserRound },
];

const linkedPayments = [
  {
    title: "Visa ending in 1234",
    subtitle: "Expires 12/26",
    tone: "text-blue-600 bg-blue-50",
    icon: CreditCard,
  },
  {
    title: "Ví điện tử MoMo",
    subtitle: "090****567",
    tone: "text-amber-600 bg-amber-50",
    icon: CreditCard,
  },
];

export default function PassengerAccountPage() {
  return (
    <>
      <Head>
        <title>Tài khoản | MetroNext</title>
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
            <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-8">
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
              <div className="mx-auto w-full max-w-[1200px] space-y-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                    <span>Hành khách</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                    <span className="text-slate-900">Tài khoản</span>
                  </div>
                  <h1 className="text-4xl font-black leading-10 text-slate-900">Cài đặt tài khoản</h1>
                  <p className="pt-1 text-sm text-slate-500">
                    Quản lý hồ sơ, bảo mật và phương thức thanh toán của bạn tại MetroNext.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.04)]">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Hồ sơ</p>
                    <p className="mt-1 text-sm font-bold text-slate-900">Đã xác thực 100%</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.04)]">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Bảo mật</p>
                    <p className="mt-1 text-sm font-bold text-slate-900">Mức cao</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.04)]">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Phương thức</p>
                    <p className="mt-1 text-sm font-bold text-slate-900">2 liên kết</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.04)]">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Hạng thành viên</p>
                    <p className="mt-1 text-sm font-bold text-slate-900">Gold</p>
                  </div>
                </div>

                <section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
                  <div className="flex items-center gap-2 text-slate-900">
                    <User className="h-5 w-5 text-blue-600" />
                    <h2 className="text-lg font-bold">Thông tin cá nhân</h2>
                  </div>

                  <div className="space-y-5">
                    <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-4 sm:p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                          <div className="relative shrink-0">
                            <div className="rounded-full bg-white p-1.5 shadow-sm ring-1 ring-slate-200">
                              <img
                                className="h-20 w-20 rounded-full object-cover sm:h-24 sm:w-24"
                                src="https://placehold.co/128x128"
                                alt="Avatar"
                              />
                            </div>
                            <button className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg ring-4 ring-white transition hover:bg-blue-700">
                              <Camera className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="space-y-1">
                            <p className="text-sm font-bold text-slate-900">Ảnh đại diện</p>
                            <p className="text-xs text-slate-500">JPG, PNG hoặc GIF. Tối đa 5MB.</p>
                            <div className="flex flex-wrap items-center gap-2 pt-0.5">
                              <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                                1:1
                              </span>
                              <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                                Khuyên dùng 512x512
                              </span>
                            </div>
                          </div>
                        </div>

                        <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                          Thay đổi ảnh
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      <label className="space-y-2">
                        <span className="text-sm font-bold text-slate-700">Họ tên</span>
                        <input
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none"
                          value="Anh Yang Say Hi (Dzz)"
                          readOnly
                        />
                      </label>

                      <label className="space-y-2">
                        <span className="text-sm font-bold text-slate-700">Email</span>
                        <input
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none"
                          value="anhyangsayhi@gmail.com"
                          readOnly
                        />
                      </label>

                      <label className="space-y-2">
                        <span className="text-sm font-bold text-slate-700">Số điện thoại</span>
                        <input
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none"
                          value="0901 234 567"
                          readOnly
                        />
                      </label>
                    </div>
                  </div>
                </section>

                <section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
                  <div className="flex items-center gap-2 text-slate-900">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <h2 className="text-lg font-bold">Bảo mật</h2>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                    Mật khẩu nên có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số để tăng mức độ an toàn.
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <label className="space-y-2">
                      <span className="text-sm font-bold text-slate-700">Mật khẩu hiện tại</span>
                      <input
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-gray-500 outline-none"
                        value="••••••••"
                        readOnly
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-bold text-slate-700">Mật khẩu mới</span>
                      <input
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-gray-500 outline-none"
                        value="Nhập mật khẩu mới"
                        readOnly
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-bold text-slate-700">Xác nhận mật khẩu mới</span>
                      <input
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-gray-500 outline-none"
                        value="Xác nhận lại"
                        readOnly
                      />
                    </label>
                  </div>
                </section>

                <div className="grid gap-5 lg:grid-cols-2">
                  <section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center gap-2 text-slate-900">
                      <Globe className="h-5 w-5 text-blue-600" />
                      <h2 className="text-lg font-bold">Tùy chọn</h2>
                    </div>

                    <div className="space-y-5">
                      <label className="space-y-2">
                        <span className="text-sm font-bold text-slate-700">Ngôn ngữ</span>
                        <button className="flex h-10 w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900">
                          <span>Tiếng Việt</span>
                          <ChevronDown className="h-4 w-4 text-slate-500" />
                        </button>
                      </label>

                      <div className="flex items-center justify-between rounded-xl px-1">
                        <div>
                          <p className="text-sm font-bold text-slate-700">Chế độ tối</p>
                          <p className="text-xs text-slate-500">Giao diện phù hợp ban đêm</p>
                        </div>
                        <button className="relative h-6 w-11 rounded-full bg-slate-200">
                          <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full border border-gray-300 bg-white" />
                        </button>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center gap-2 text-slate-900">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                      <h2 className="text-lg font-bold">Liên kết thanh toán</h2>
                    </div>

                    <div className="space-y-3">
                      {linkedPayments.map((payment) => {
                        const PaymentIcon = payment.icon;
                        return (
                          <div
                            key={payment.title}
                            className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-2.5"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${payment.tone}`}>
                                <PaymentIcon className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-900">{payment.title}</p>
                                <p className="text-xs text-slate-500">{payment.subtitle}</p>
                              </div>
                            </div>
                            <button className="text-red-500">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    <button className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-300 py-2 text-sm font-bold text-slate-500">
                      <Plus className="h-3 w-3" />
                      <span>Thêm phương thức</span>
                    </button>
                  </section>
                </div>
              </div>
            </section>

            <div className="sticky bottom-0 z-10 border-t border-slate-200 bg-white/95 px-4 py-4 shadow-[0px_-4px_10px_rgba(0,0,0,0.03)] backdrop-blur sm:px-8">
              <div className="mx-auto flex w-full max-w-[1200px] justify-end gap-3">
                <button className="rounded-xl border border-slate-200 bg-white px-8 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">
                  Hủy
                </button>
                <button className="rounded-xl bg-blue-600 px-8 py-2.5 text-sm font-bold text-white shadow-[0px_10px_15px_-3px_rgba(19,127,236,0.20)] hover:bg-blue-700">
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
