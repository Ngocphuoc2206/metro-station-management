import Link from "next/link";
import { useRouter } from "next/router";
import type { ReactNode } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Bell,
  History,
  LayoutDashboard,
  LogOut,
  MapPinned,
  QrCode,
  Search,
  Settings,
  Ticket,
  TrainFront,
  UserRound,
} from "lucide-react";
import type { AppDispatch, RootState } from "@stores/index";
import { logout } from "@stores/slices/userSlice";

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

type PassengerShellProps = {
  children: ReactNode;
};

export default function PassengerShell({ children }: PassengerShellProps) {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { name, email } = useSelector((state: RootState) => state.userReducer);

  const displayName = name || "Hanh khach";
  const displayEmail = email || "MetroNext";

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    sessionStorage.removeItem("persist:root");
    dispatch(logout());
    router.push("/auth/login");
  };

  const isBuyTicketActive =
    router.pathname.startsWith("/passenger-page/buy-tickets-step-") ||
    router.pathname === "/passenger-page/payment-success";

  const navItems = [
    {
      label: "Dashboard",
      href: "/passenger-page",
      icon: LayoutDashboard,
      active: router.pathname === "/passenger-page",
    },
    {
      label: "Mua vé",
      href: "/passenger-page/buy-tickets-step-1",
      icon: Ticket,
      active: isBuyTicketActive,
    },
    {
      label: "Vé của tôi",
      href: "/passenger-page/my-tickets",
      icon: QrCode,
      active: router.pathname === "/passenger-page/my-tickets",
    },
    {
      label: "Lịch sử chuyến",
      href: "/passenger-page/history",
      icon: History,
      active: router.pathname === "/passenger-page/history",
    },
    {
      label: "Lịch tàu",
      href: "/passenger-page/schedule",
      icon: TrainFront,
      active: router.pathname === "/passenger-page/schedule",
    },
    {
      label: "Bản đồ live",
      href: "/passenger-page/live-map",
      icon: MapPinned,
      active: router.pathname === "/passenger-page/live-map",
    },
    {
      label: "Tài khoản",
      href: "/passenger-page/account",
      icon: UserRound,
      active: router.pathname === "/passenger-page/account",
    },
  ];

  return (
    <div className="min-h-screen w-full bg-[radial-gradient(circle_at_8%_12%,rgba(37,99,235,0.10),transparent_42%),radial-gradient(circle_at_92%_18%,rgba(16,185,129,0.10),transparent_38%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_48%,#f8fafc_100%)]">
      <div className="flex min-h-screen w-full">
        <aside className="hidden w-64 shrink-0 border-r border-slate-200/80 bg-white/90 backdrop-blur lg:flex lg:flex-col">
          <div className="flex items-center gap-3 p-6">
            <div className="flex h-8 w-8 items-center justify-center overflow-hidden">
              <BrandMark className="h-8 w-8" />
            </div>
            <Link
              href="/"
              className="text-xl font-bold leading-6 text-neutral-900"
            >
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
                  <Icon
                    className={`h-4 w-4 ${item.active ? "text-blue-600" : "text-slate-500"}`}
                  />
                  <span
                    className={`text-sm ${item.active ? "font-semibold" : "font-medium"}`}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-slate-200 p-4">
            <div
              className="flex items-center gap-3 rounded-2xl p-2"
              title={`${displayName} - ${displayEmail}`}
            >
              <img
                className="h-10 w-10 rounded-full object-cover"
                src="https://placehold.co/40x40"
                alt="Passenger avatar"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-neutral-900">
                  {displayName}
                </p>
                <p className="truncate text-xs text-slate-500">
                  Hành khách Gold
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100"
            >
              <LogOut className="h-4 w-4" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur sm:px-8">
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
              <button
                type="button"
                onClick={handleLogout}
                className="hidden h-10 items-center gap-2 rounded-2xl bg-red-50 px-3 text-sm font-semibold text-red-600 transition hover:bg-red-100 sm:flex"
              >
                <LogOut className="h-4 w-4" />
                <span>Đăng xuất</span>
              </button>
            </div>
          </header>

          <section className="flex-1 p-4 sm:p-8">{children}</section>
        </main>
      </div>
    </div>
  );
}
