/* eslint-disable @typescript-eslint/no-explicit-any */
import { useSelector } from "react-redux";
import { useLogout } from "@features/auth/useLogout";
import type { RootState } from "@stores/index";
import Link from "next/link";
import router from "next/router";

const STAFF_NAV = [
  { label: "Tổng quan", href: "/staff", icon: DashboardIcon },
  { label: "Thiết bị", href: "/staff/devices", icon: EquipmentIcon },
  { label: "Sự cố", href: "/staff/incidents", icon: IncidentIcon },
  { label: "Quét vé", href: "/staff/scan", icon: ScanIcon },
  { label: "Nhật ký soát vé", href: "/staff/ticket-log", icon: TicketLogIcon },
];

export default function StaffSidebar() {
  const { name } = useSelector((s: RootState) => s.userReducer);
  const handleLogout = useLogout();

  // Nếu name trống hoặc trùng email → dùng phần trước @ của email làm tên hiển thị
  const isNameEmail = name && name.includes("@");
  const displayName = isNameEmail
    ? name.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : name;

  return (
    <aside className="sticky top-0 flex h-screen w-20 shrink-0 flex-col border-r border-gray-100 bg-white sm:w-64">
      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 border-b border-gray-50 px-3 py-5 sm:justify-start sm:px-6">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg
              className="w-5 h-5 text-white"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="hidden text-lg font-bold text-gray-900 sm:inline">
            Metro
          </span>
        </div>

        {/* Menu Nav */}
        <nav className="space-y-1 px-2 py-6 sm:px-4">
          {STAFF_NAV.map((item) => {
            const active = router.pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center justify-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 sm:justify-start ${
                  active
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon active={active} />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

    </aside>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────
function NavIcon({ d, active }: { d: string; active: boolean }) {
  return (
    <svg
      className={`w-5 h-5 flex-shrink-0 transition-colors ${active ? "text-blue-600" : "text-gray-400"}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

function DashboardIcon(p: any) {
  return (
    <NavIcon
      {...p}
      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
    />
  );
}
function EquipmentIcon(p: any) {
  return (
    <NavIcon
      {...p}
      d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
    />
  );
}
function IncidentIcon(p: any) {
  return (
    <NavIcon
      {...p}
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
    />
  );
}
function ScanIcon(p: any) {
  return (
    <NavIcon
      {...p}
      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
    />
  );
}
function TransactionIcon(p: any) {
  return (
    <NavIcon
      {...p}
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
    />
  );
}
function TicketLogIcon(p: any) {
  return (
    <NavIcon
      {...p}
      d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
    />
  );
}
function ShiftProfileIcon(p: any) {
  return (
    <NavIcon
      {...p}
      d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
    />
  );
}
function SettingsIcon(p: any) {
  return (
    <NavIcon
      {...p}
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
  );
}
