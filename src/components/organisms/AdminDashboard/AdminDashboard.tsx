import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import type { RootState } from "@stores/index";
import { logout } from "@stores/slices/userSlice";
import type { AppDispatch } from "@stores/index";

const STATS = [
  { label: "Người dùng", value: "—", icon: "👥" },
  { label: "Vé hôm nay", value: "—", icon: "🎫" },
  { label: "Doanh thu", value: "—", icon: "💰" },
  { label: "Sự cố", value: "—", icon: "⚠️" },
];

const ADMIN_ACTIONS = [
  { icon: "👥", label: "Quản lý người dùng", desc: "Thêm, sửa, phân quyền", href: "#" },
  { icon: "🛤️", label: "Tuyến & Ga", desc: "Quản lý routes & stations", href: "#" },
  { icon: "🎟️", label: "Loại vé & Giá", desc: "Cấu hình fare matrix", href: "#" },
  { icon: "📈", label: "Báo cáo", desc: "Thống kê & phân tích", href: "#" },
  { icon: "📋", label: "Audit Logs", desc: "Theo dõi hoạt động hệ thống", href: "#" },
  { icon: "⚙️", label: "Cài đặt hệ thống", desc: "Cấu hình hệ thống", href: "#" },
];

export default function AdminDashboard() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { name, email } = useSelector((state: RootState) => state.userReducer);

  const handleLogout = () => {
    dispatch(logout());
    router.push("/auth/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-800 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <div>
              <span className="font-bold text-gray-900">MetroNext Admin</span>
              <span className="ml-2 text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium">Quản trị viên</span>
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

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Welcome */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-6 text-white">
          <p className="text-slate-300 text-sm mb-1">Quản trị viên 🛡️</p>
          <h1 className="text-2xl font-bold">{name}</h1>
          <p className="text-slate-300 text-sm mt-1">Bảng điều khiển hệ thống MetroNext</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-5">
              <span className="text-2xl">{stat.icon}</span>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Admin actions */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Quản lý hệ thống</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {ADMIN_ACTIONS.map((action) => (
              <button
                key={action.label}
                className="bg-white rounded-2xl p-5 text-left border border-gray-100 hover:border-slate-300 hover:shadow-md transition-all duration-200 group"
              >
                <span className="text-3xl mb-3 block">{action.icon}</span>
                <p className="font-semibold text-gray-900 group-hover:text-slate-700 text-sm transition-colors">{action.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{action.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
