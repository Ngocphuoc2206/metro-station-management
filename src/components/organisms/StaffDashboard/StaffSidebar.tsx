import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@stores/index";
import type { AppDispatch } from "@stores/index";
import { logout } from "@stores/slices/userSlice";
import Link from "next/link";

const STAFF_NAV = [
  { label: "Tổng quan", href: "/staff", icon: DashboardIcon },
  { label: "Thiết bị", href: "/staff/devices", icon: EquipmentIcon },
  { label: "Sự cố", href: "/staff/incidents", icon: IncidentIcon },
  { label: "Nhật ký soát vé", href: "/dashboard/scanner", icon: TicketLogIcon },
  { label: "Hồ sơ ca trực", href: "/staff/shift-profile", icon: ShiftProfileIcon },
];

export default function StaffSidebar() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { name, email, role } = useSelector((s: RootState) => s.userReducer);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    dispatch(logout());
    router.push("/auth/login");
  };

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-100 flex flex-col justify-between">
      <div>
        {/* Logo */}
        <div className="px-6 py-5 border-b border-gray-50 flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="font-bold text-gray-900 text-lg">MetroNext</span>
        </div>

        {/* Menu Nav */}
        <nav className="px-4 py-6 space-y-1">
          {STAFF_NAV.map((item) => {
            const active = router.pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon active={active} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Cài đặt & User Info */}
      <div className="px-5 py-4 border-t border-gray-100 space-y-2">
        <a href="#settings" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">
          <SettingsIcon active={false} />
          Cài đặt
        </a>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-3 pt-2 w-full">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <span className="text-emerald-700 font-bold mb-0.5">
                {name ? name.charAt(0).toUpperCase() : "S"}
              </span>
            </div>
            <div className="min-w-0 pr-2">
              <p className="text-sm font-bold text-gray-900 truncate">{name || "Nhân viên"}</p>
              <p className="text-xs text-gray-400 truncate">{email || "Vai trò: Nhân viên ga"}</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full text-xs font-semibold text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg py-2 mt-2 transition-colors border border-transparent hover:border-red-100"
        >
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────
function NavIcon({ d, active }: { d: string; active: boolean }) {
  return (
    <svg className={`w-5 h-5 flex-shrink-0 transition-colors ${active ? "text-blue-600" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

function DashboardIcon(p: any) { return <NavIcon {...p} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />; }
function EquipmentIcon(p: any) { return <NavIcon {...p} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />; }
function IncidentIcon(p: any) { return <NavIcon {...p} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />; }
function TicketLogIcon(p: any) { return <NavIcon {...p} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />; }
function ShiftProfileIcon(p: any) { return <NavIcon {...p} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />; }
function SettingsIcon(p: any) { return <NavIcon {...p} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />; }
