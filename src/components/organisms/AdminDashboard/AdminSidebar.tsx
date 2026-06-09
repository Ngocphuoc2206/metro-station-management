import { useState } from "react";
import { useSelector } from "react-redux";
import { useLogout } from "@features/auth/useLogout";
import type { RootState } from "@stores/index";
import router from "next/router";
import { Menu, X } from "lucide-react";

const NAV_GROUPS = [
  {
    heading: "QUẢN TRỊ",
    items: [
      { label: "Tổng quan", href: "/dashboard/admin", icon: DashboardIcon },
      { label: "Ga", href: "/admin/stations", icon: StationIcon },
      { label: "Thiết bị", href: "/admin/devices", icon: DeviceIcon },
      { label: "Tuyến", href: "/admin/routes", icon: RouteIcon },
      { label: "Lịch tàu", href: "/admin/schedules", icon: ScheduleIcon },
      { label: "Loại vé", href: "/admin/ticket-types", icon: TicketIcon },
      { label: "Duyệt sự cố", href: "/admin/incidents", icon: IncidentIcon },
    ],
  },
  {
    heading: "HỆ THỐNG",
    items: [
      { label: "Người dùng", href: "/admin/users", icon: UsersIcon },
      { label: "Phân quyền", href: "/admin/permissions", icon: ShieldIcon },
      { label: "Báo cáo", href: "/admin/reports", icon: ReportIcon },
      {
        label: "Cài đặt",
        href: "/dashboard/admin/settings",
        icon: SettingsIcon,
      },
    ],
  },
];

export default function AdminSidebar() {
  const { name, email } = useSelector((s: RootState) => s.userReducer);
  const handleLogout = useLogout();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Nếu name trùng email → extract tên đọc được từ prefix
  const isNameEmail = name && name.includes("@");
  const displayName = isNameEmail
    ? name.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : name;

  return (
    <>
    <aside className="hidden min-h-screen w-56 shrink-0 flex-col justify-between border-r border-gray-100 bg-white lg:flex">
      {/* Logo */}
      <div>
        <div className="border-b border-gray-50 px-3 py-5 sm:px-5">
          <div className="flex items-center justify-center gap-2.5 sm:justify-start">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg
                className="w-4.5 h-4.5 text-white"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-gray-900 leading-tight">
                Metro
              </p>
              <p className="text-xs text-gray-400 leading-tight">
                Hệ thống doanh nghiệp
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="space-y-5 px-2 py-4 sm:px-3">
          {NAV_GROUPS.map((group) => (
            <div key={group.heading}>
              <p className="mb-2 hidden px-2 text-xs font-semibold tracking-widest text-gray-400 sm:block">
                {group.heading}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active = router.pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <li key={item.label}>
                      <a
                        href={item.href}
                        className={`flex items-center justify-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors sm:justify-start ${
                          active
                            ? "bg-blue-600 text-white font-medium"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                      >
                        <Icon active={active} />
                        <span className="hidden sm:inline">{item.label}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      {/* User section moved to header */}
    </aside>

    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setIsMobileMenuOpen((current) => !current)}
        className="fixed left-3 top-3 z-50 flex h-10 w-10 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-700 shadow-sm backdrop-blur transition hover:bg-gray-50"
        aria-label={isMobileMenuOpen ? "Đóng menu" : "Mở menu"}
        aria-expanded={isMobileMenuOpen}
      >
        {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {isMobileMenuOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-[1px]"
            aria-label="Đóng menu"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed left-3 right-3 top-16 z-50 max-h-[calc(100vh-5rem)] overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl">
            <div className="flex items-center gap-3 border-b border-gray-100 p-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4.5 h-4.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-gray-900">{displayName || "Admin User"}</p>
                <p className="truncate text-xs text-gray-400">{email || "Super Admin"}</p>
              </div>
            </div>

            <nav className="max-h-[70vh] space-y-5 overflow-y-auto p-3">
              {NAV_GROUPS.map((group) => (
                <div key={group.heading}>
                  <p className="mb-2 px-2 text-[10px] font-semibold tracking-widest text-gray-400">{group.heading}</p>
                  <ul className="space-y-1">
                    {group.items.map((item) => {
                      const active = router.pathname === item.href;
                      const Icon = item.icon;
                      return (
                        <li key={item.label}>
                          <a
                            href={item.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm transition ${
                              active ? "bg-blue-600 font-bold text-white" : "font-semibold text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            <Icon active={active} />
                            <span>{item.label}</span>
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
              <div className="border-t border-gray-100 pt-2">
                <button
                  onClick={handleLogout}
                  className="w-full rounded-2xl px-3 py-3 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >
                  Đăng xuất
                </button>
              </div>
            </nav>
          </div>
        </>
      ) : null}
    </div>
    </>
  );
}

// ── Inline SVG Icons ───────────────────────────────────────────────────────────

function NavIcon({ d, active }: { d: string; active: boolean }) {
  return (
    <svg
      className={`w-4 h-4 flex-shrink-0 ${active ? "text-white" : "text-gray-400"}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

function DashboardIcon({ active }: { active: boolean }) {
  return (
    <NavIcon
      active={active}
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    />
  );
}
function StationIcon({ active }: { active: boolean }) {
  return (
    <NavIcon
      active={active}
      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z"
    />
  );
}
function DeviceIcon({ active }: { active: boolean }) {
  return (
    <NavIcon
      active={active}
      d="M9 3h6a2 2 0 012 2v14a2 2 0 01-2 2H9a2 2 0 01-2-2V5a2 2 0 012-2z M11 17h2"
    />
  );
}
function RouteIcon({ active }: { active: boolean }) {
  return (
    <NavIcon
      active={active}
      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
    />
  );
}
function ScheduleIcon({ active }: { active: boolean }) {
  return (
    <NavIcon
      active={active}
      d="M8 7V3m8 4V3M4 11h16M6 5h12a2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2zm6 9h.01M15 14h.01M9 17h.01M12 17h.01"
    />
  );
}
function TicketIcon({ active }: { active: boolean }) {
  return (
    <NavIcon
      active={active}
      d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
    />
  );
}
function PriceIcon({ active }: { active: boolean }) {
  return (
    <NavIcon
      active={active}
      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  );
}
function UsersIcon({ active }: { active: boolean }) {
  return (
    <NavIcon
      active={active}
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
    />
  );
}
function ShieldIcon({ active }: { active: boolean }) {
  return (
    <NavIcon
      active={active}
      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
    />
  );
}
function ReportIcon({ active }: { active: boolean }) {
  return (
    <NavIcon
      active={active}
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    />
  );
}
function LogIcon({ active }: { active: boolean }) {
  return (
    <NavIcon
      active={active}
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
    />
  );
}
function SettingsIcon({ active }: { active: boolean }) {
  return (
    <NavIcon
      active={active}
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
  );
}
function IncidentIcon({ active }: { active: boolean }) {
  return (
    <NavIcon
      active={active}
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
    />
  );
}
