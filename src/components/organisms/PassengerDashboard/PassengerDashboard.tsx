import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import type { RootState } from "@stores/index";
import { logout } from "@stores/slices/userSlice";
import type { AppDispatch } from "@stores/index";

const STATS = [
  { label: "Vé hôm nay", value: "—", icon: "🎫" },
  { label: "Số dư", value: "—", icon: "💰" },
  { label: "Chuyến đi", value: "—", icon: "🚇" },
  { label: "Điểm thưởng", value: "—", icon: "⭐" },
];

const PASSENGER_ACTIONS = [
  { icon: "🎟️", label: "Mua vé", desc: "Mua vé lượt & vé tháng", href: "#" },
  { icon: "📋", label: "Lịch sử", desc: "Xem lịch sử chuyến đi", href: "#" },
  { icon: "🗺️", label: "Bản đồ tuyến", desc: "Xem sơ đồ metro", href: "#" },
  { icon: "👤", label: "Tài khoản", desc: "Thông tin cá nhân", href: "#" },
];

export default function PassengerDashboard() {
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
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            <div>
              <span className="font-bold text-gray-900">MetroNext</span>
              <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Hành khách</span>
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
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl p-6 text-white">
          <p className="text-blue-100 text-sm mb-1">Xin chào 👋</p>
          <h1 className="text-2xl font-bold">{name}</h1>
          <p className="text-blue-100 text-sm mt-1">Chào mừng bạn đến với MetroNext</p>
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

        {/* Quick actions */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Dịch vụ</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {PASSENGER_ACTIONS.map((action) => (
              <button
                key={action.label}
                className="bg-white rounded-2xl p-5 text-left border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all duration-200 group"
              >
                <span className="text-3xl mb-3 block">{action.icon}</span>
                <p className="font-semibold text-gray-900 group-hover:text-blue-600 text-sm transition-colors">{action.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{action.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
