import { ReactNode, useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import { useLogout } from "@features/auth/useLogout";
import type { RootState } from "@stores/index";
import StaffSidebar from "./StaffSidebar";

interface Props {
  children: ReactNode;
  wide?: boolean;
}

export default function StaffLayout({ children, wide = false }: Props) {
  const { name } = useSelector((s: RootState) => s.userReducer);
  const handleLogout = useLogout();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Display name: nếu là email thì lấy phần trước @
  const isNameEmail = name && name.includes("@");
  const displayName = isNameEmail
    ? name.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : name || "Nhân viên";

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w: string) => w[0].toUpperCase())
    .join("");

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setDropdownOpen(false);
    }, 200);
  };

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden bg-gray-50">
      <StaffSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-10 flex w-full items-center justify-between gap-3 border-b border-gray-100 bg-white py-3 pl-16 pr-3 sm:pl-16 sm:pr-5 lg:px-8">
          <div className="flex-1" />

          <div className="ml-3 flex items-center gap-3 sm:gap-4">
            <button className="relative text-gray-400 hover:text-gray-700 transition">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white" />
            </button>

            {/* Avatar dropdown */}
            <div 
              className="relative flex items-center gap-2 border-l pl-4 border-gray-100" 
              ref={dropdownRef}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              {/* Tên hiển thị */}
              <span className="hidden sm:block text-sm font-semibold text-gray-700 truncate max-w-[120px]">
                {displayName}
              </span>

              <button
                onClick={() => setDropdownOpen((v) => !v)}
                className="w-9 h-9 rounded-full bg-teal-600 flex items-center justify-center relative shadow-sm border border-gray-100 hover:ring-2 hover:ring-teal-300 transition"
                aria-haspopup="true"
                aria-expanded={dropdownOpen}
              >
                <span className="text-white text-xs font-bold">{initials || "NV"}</span>
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
              </button>

              {/* Dropdown — chỉ 2 mục */}
              {dropdownOpen && (
                <div className="absolute right-0 top-full pt-2 w-48 z-50 animate-fade-in">
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5">
                    <button
                      onClick={() => setDropdownOpen(false)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition text-left"
                    >
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Quản lí hồ sơ
                    </button>
                    <div className="border-t border-gray-50 my-1" />
                    <button
                      onClick={() => { setDropdownOpen(false); handleLogout(); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition text-left font-semibold"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-3 sm:p-5 lg:p-6">
          <div className={`mx-auto w-full ${wide ? "max-w-[1480px]" : "max-w-[1200px]"}`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
