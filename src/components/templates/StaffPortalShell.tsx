import Link from "next/link";
import { useRouter } from "next/router";
import type { ReactNode } from "react";
import { Bell, LayoutDashboard, QrCode, ScrollText, Search, Settings2 } from "lucide-react";

const BrandMark = ({ className = "h-5 w-5" }: { className?: string }) => (
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

type StaffPortalShellProps = {
  children: ReactNode;
  breadcrumb?: {
    section?: string;
    page?: string;
  };
  headerTitle?: string;
  headerMode?: "breadcrumb" | "title" | "search" | "stacked";
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  systemStatus?: {
    label: string;
    tone: "green" | "amber" | "red" | "blue";
  };
};

const toneClass = {
  green: {
    container: "bg-green-100",
    dot: "bg-green-500",
    text: "text-green-600",
  },
  blue: {
    container: "bg-blue-50 outline outline-1 outline-offset-[-1px] outline-blue-600/20",
    dot: "bg-blue-600",
    text: "text-blue-600",
  },
  amber: {
    container: "bg-amber-100",
    dot: "bg-amber-500",
    text: "text-amber-700",
  },
  red: {
    container: "bg-red-100",
    dot: "bg-red-500",
    text: "text-red-700",
  },
};

export default function StaffPortalShell({
  children,
  breadcrumb,
  headerTitle,
  headerMode = "breadcrumb",
  searchPlaceholder = "Tìm kiếm giao dịch, ticket code...",
  searchValue,
  onSearchChange,
  systemStatus = { label: "SYSTEM NORMAL", tone: "green" },
}: StaffPortalShellProps) {
  const router = useRouter();

  const navItems = [
    {
      label: "Dashboard",
      href: "/staff/gate-ops-dashboard",
      icon: LayoutDashboard,
      active: router.pathname === "/staff/gate-ops-dashboard",
    },
    {
      label: "Quét vé",
      href: "/staff/scan",
      icon: QrCode,
      active: router.pathname === "/staff/scan",
    },
    {
      label: "Nhật ký giao dịch",
      href: "/staff/transaction-logs",
      icon: ScrollText,
      active: router.pathname === "/staff/transaction-logs",
    },
    {
      label: "Cấu hình thiết bị",
      href: "/staff/device-config",
      icon: Settings2,
      active: router.pathname === "/staff/device-config",
    },
  ];

  const sectionLabel = breadcrumb?.section ?? "Staff Portal";
  const pageLabel = breadcrumb?.page ?? "Dashboard";

  return (
    <div className="min-h-screen w-full bg-[radial-gradient(circle_at_8%_12%,rgba(37,99,235,0.10),transparent_42%),radial-gradient(circle_at_92%_18%,rgba(16,185,129,0.10),transparent_38%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_48%,#f8fafc_100%)]">
      <div className="flex min-h-screen w-full">
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
          <div className="p-6">
            <div className="flex items-center gap-2">
              <div className="flex h-5 w-5 items-center justify-center overflow-hidden">
                <BrandMark className="h-5 w-5" />
              </div>
              <Link href="/" className="text-xl font-bold leading-8 text-blue-600">
                MetroNext
              </Link>
            </div>
            <p className="mt-1 text-sm font-medium leading-5 text-slate-500">Staff Portal</p>
          </div>

          <nav className="flex-1 px-3">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`flex w-full items-center gap-3 rounded-3xl p-3 transition ${
                      item.active ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${item.active ? "text-white" : "text-slate-600"}`} />
                    <span className="text-sm font-medium leading-5">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="border-t border-slate-200 p-4">
            <div className="flex items-center gap-3 rounded-3xl bg-slate-50 p-2">
              <img
                className="h-8 w-8 rounded-full bg-slate-300 object-cover"
                src="https://placehold.co/32x32"
                alt="Avatar"
              />
              <div className="min-w-0">
                <p className="truncate text-xs font-bold leading-4 text-slate-900">Admin User</p>
                <p className="truncate text-[10px] font-normal uppercase leading-4 text-slate-500">
                  Station Master
                </p>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8">
            {headerMode === "search" ? (
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
                <input
                  className="w-64 rounded-xl bg-transparent px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-gray-500"
                  placeholder={searchPlaceholder}
                  value={searchValue}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                />
              </div>
            ) : headerMode === "stacked" ? (
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase leading-4 tracking-wide text-slate-400">
                    {sectionLabel}
                  </span>
                  <span className="h-1.5 w-1 rounded-full bg-slate-400" aria-hidden="true" />
                  <span className="text-[10px] font-bold uppercase leading-4 tracking-wide text-blue-600">
                    {pageLabel}
                  </span>
                </div>
                <div className="text-lg font-bold leading-6 text-slate-800">{headerTitle}</div>
              </div>
            ) : headerMode === "title" ? (
              <div className="text-lg font-bold leading-7 text-slate-800">{headerTitle}</div>
            ) : (
              <div className="flex items-center gap-2 text-sm leading-5">
                <span className="text-slate-400">{sectionLabel}</span>
                <span className="h-1.5 w-1 rounded-full bg-slate-300" aria-hidden="true" />
                <span className="font-semibold text-slate-600">{pageLabel}</span>
              </div>
            )}

            <div className="flex items-center gap-4">
              <div
                className={`flex items-center gap-1 rounded-full px-3 py-1 ${toneClass[systemStatus.tone].container}`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${toneClass[systemStatus.tone].dot}`}
                  aria-hidden="true"
                />
                <span
                  className={`text-xs font-bold leading-4 ${toneClass[systemStatus.tone].text}`}
                >
                  {systemStatus.label}
                </span>
              </div>

              <button
                type="button"
                className="relative inline-flex items-center justify-center rounded-full p-2 text-slate-500 hover:bg-slate-50"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute right-[6px] top-[6px] h-2 w-2 rounded-full border-2 border-white bg-red-500" />
              </button>

              {headerMode === "search" ? (
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full p-2 text-slate-500 hover:bg-slate-50"
                  aria-label="Settings"
                >
                  <Settings2 className="h-5 w-5" />
                </button>
              ) : null}
            </div>
          </header>

          <section className="flex-1 p-8">{children}</section>
        </main>
      </div>
    </div>
  );
}
