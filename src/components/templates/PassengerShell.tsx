import { useRouter } from "next/router";
import type { ReactNode } from "react";
import { useDispatch } from "react-redux";
import { Bell, LogOut, Search, Settings } from "lucide-react";
import PassengerChatbotWidget from "@components/organisms/PassengerChatbot/PassengerChatbotWidget";
import PassengerSidebar from "./PassengerSidebar";
import type { AppDispatch } from "@stores/index";
import { logout } from "@stores/slices/userSlice";

type PassengerShellProps = {
  children: ReactNode;
};

export default function PassengerShell({ children }: PassengerShellProps) {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    sessionStorage.removeItem("persist:root");
    dispatch(logout());
    router.push("/auth/login");
  };

  return (
    <div className="min-h-screen w-full bg-[radial-gradient(circle_at_8%_12%,rgba(37,99,235,0.10),transparent_42%),radial-gradient(circle_at_92%_18%,rgba(16,185,129,0.10),transparent_38%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_48%,#f8fafc_100%)]">
      <div className="flex min-h-screen w-full">
        <PassengerSidebar />

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
              <button
                type="button"
                aria-label="Thông báo"
                className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-red-500" />
              </button>
              <button
                type="button"
                aria-label="Cài đặt"
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600"
              >
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
      <PassengerChatbotWidget />
    </div>
  );
}
