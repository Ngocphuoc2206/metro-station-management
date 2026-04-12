import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@stores/index";
import type { AppDispatch } from "@stores/index";
import { logout } from "@stores/slices/userSlice";

const NAV_GROUPS = [
  {
    heading: "QUẢN TRỊ",
    items: [
      { label: "Tổng quan", href: "/dashboard/admin", icon: DashboardIcon },
      { label: "Ga", href: "/dashboard/admin/stations", icon: StationIcon },
      { label: "Tuyến", href: "/dashboard/admin/routes", icon: RouteIcon },
      { label: "Loại vé", href: "/dashboard/admin/ticket-types", icon: TicketIcon },
      { label: "Bảng giá", href: "/dashboard/admin/fares", icon: PriceIcon },
    ],
  },
  {
    heading: "HỆ THỐNG",
    items: [
      { label: "Người dùng", href: "/dashboard/admin/users", icon: UsersIcon },
      { label: "Phân quyền", href: "/dashboard/admin/permissions", icon: ShieldIcon },
      { label: "Báo cáo", href: "#", icon: ReportIcon },
      { label: "Audit Logs", href: "/dashboard/admin/audit-logs", icon: LogIcon },
      { label: "Cài đặt", href: "#", icon: SettingsIcon },
    ],
  },
];

export default function AdminSidebar() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { name, email } = useSelector((s: RootState) => s.userReducer);

  const handleLogout = () => {
    dispatch(logout());
    router.push("/auth/login");
  };

  return (
    <aside className="w-56 min-h-screen bg-white border-r border-gray-100 flex flex-col justify-between">
      {/* Logo */}
      <div>
        <div className="px-5 py-5 border-b border-gray-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4.5 h-4.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 leading-tight">MetroNext</p>
              <p className="text-xs text-gray-400 leading-tight">Enterprise System</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="px-3 py-4 space-y-5">
          {NAV_GROUPS.map((group) => (
            <div key={group.heading}>
              <p className="text-xs font-semibold text-gray-400 tracking-widest px-2 mb-2">
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
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${active
                            ? "bg-blue-600 text-white font-medium"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                          }`}
                      >
                        <Icon active={active} />
                        {item.label}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      {/* User */}
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <span className="text-blue-700 text-xs font-bold">
              {name ? name.charAt(0).toUpperCase() : "A"}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-900 truncate">{name || "Admin User"}</p>
            <p className="text-xs text-gray-400 truncate">{email || "Super Admin"}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full text-xs text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg py-1.5 transition-colors"
        >
          Đăng xuất
        </button>
      </div>
    </aside>
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
  return <NavIcon active={active} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />;
}
function StationIcon({ active }: { active: boolean }) {
  return <NavIcon active={active} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />;
}
function RouteIcon({ active }: { active: boolean }) {
  return <NavIcon active={active} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />;
}
function TicketIcon({ active }: { active: boolean }) {
  return <NavIcon active={active} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />;
}
function PriceIcon({ active }: { active: boolean }) {
  return <NavIcon active={active} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />;
}
function UsersIcon({ active }: { active: boolean }) {
  return <NavIcon active={active} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />;
}
function ShieldIcon({ active }: { active: boolean }) {
  return <NavIcon active={active} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />;
}
function ReportIcon({ active }: { active: boolean }) {
  return <NavIcon active={active} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />;
}
function LogIcon({ active }: { active: boolean }) {
  return <NavIcon active={active} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />;
}
function SettingsIcon({ active }: { active: boolean }) {
  return <NavIcon active={active} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />;
}