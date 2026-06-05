import { LogOut } from "lucide-react";
import { useLogout } from "@features/auth/useLogout";

export default function PassengerLogoutButton() {
  const handleLogout = useLogout();

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
