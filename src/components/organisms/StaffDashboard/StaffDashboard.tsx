import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import type { RootState } from "@stores/index";
import { logout } from "@stores/slices/userSlice";
import type { AppDispatch } from "@stores/index";
import Link from "next/link";

const STAFF_ACTIONS = [
  { icon: "📷", label: "Gate Scanner Tool", desc: "Quét QR vé tại cổng soát", href: "/dashboard/scanner" },
  { icon: "📊", label: "Station Dashboard", desc: "Theo dõi trạng thái ga", href: "#" },
  { icon: "⚠️", label: "Báo cáo sự cố", desc: "Tạo & cập nhật sự cố", href: "#" },
  { icon: "🕐", label: "Ca làm việc", desc: "Quản lý lịch ca trực", href: "#" },
  { icon: "🖥️", label: "Thiết bị", desc: "Quản lý thiết bị tại ga", href: "#" },
];

const STATUS_ITEMS = [
  { label: "Cổng soát vé", status: "Hoạt động", color: "green" },
  { label: "Màn hình thông tin", status: "Hoạt động", color: "green" },
  { label: "Máy bán vé tự động", status: "Bảo trì", color: "yellow" },
];

export default function StaffDashboard() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { name, email } = useSelector((state: RootState) => state.userReducer);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    dispatch(logout());
    router.push("/auth/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <span className="font-bold text-gray-900">MetroNext Staff</span>
              <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Nhân viên ga</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{name}</p>
              <p className="text-xs text-gray-500">{email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-red-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Welcome */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-2xl p-6 text-white">
          <p className="text-emerald-100 text-sm mb-1">Nhân viên ga 👷</p>
          <h1 className="text-2xl font-bold">{name}</h1>
          <p className="text-emerald-100 text-sm mt-1">Ca làm việc hôm nay đang hoạt động</p>
          <div className="mt-4 inline-flex items-center gap-2 bg-white/20 rounded-full px-3 py-1 text-sm">
            <span className="w-2 h-2 bg-green-300 rounded-full inline-block animate-pulse" />
            Online
          </div>
        </div>

        {/* Station Status */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">Trạng thái thiết bị tại ga</h2>
          <div className="space-y-3">
            {STATUS_ITEMS.map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-700">{item.label}</span>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  item.color === "green" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                }`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Chức năng</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {STAFF_ACTIONS.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="bg-white rounded-2xl p-5 text-left border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all duration-200 group block"
              >
                <span className="text-3xl mb-3 block">{action.icon}</span>
                <p className="font-semibold text-gray-900 group-hover:text-emerald-600 text-sm transition-colors">{action.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{action.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
