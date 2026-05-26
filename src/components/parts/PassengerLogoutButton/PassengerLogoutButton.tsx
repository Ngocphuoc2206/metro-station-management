import { LogOut } from "lucide-react";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@stores/index";
import { logout } from "@stores/slices/userSlice";

export default function PassengerLogoutButton() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    sessionStorage.removeItem("persist:root");
    dispatch(logout());
    router.push("/auth/login");
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100"
    >
      <LogOut className="h-4 w-4" />
      <span>Đăng xuất</span>
    </button>
  );
}
