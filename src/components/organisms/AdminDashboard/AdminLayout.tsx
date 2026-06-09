import { ReactNode } from "react";
import AdminSidebar from "./AdminSidebar";
import Head from "next/head";
import { useSelector } from "react-redux";
import { useLogout } from "@features/auth/useLogout";
import type { RootState } from "@stores/index";

interface Props {
  children: ReactNode;
  title?: string;
}

export default function AdminLayout({ children, title = "MetroNext Admin" }: Props) {
  const { name, role } = useSelector((s: RootState) => s.userReducer);
  const handleLogout = useLogout();

  const isNameEmail = name && name.includes("@");
  const displayName = isNameEmail
    ? name.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : name;

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <div className="flex min-h-screen w-full overflow-x-hidden bg-gray-50">
        {/* Sidebar */}
        <AdminSidebar />

        {/* Main content */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top bar */}
          <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-gray-100 bg-white py-3 pl-16 pr-3 sm:pl-16 sm:pr-5 lg:px-8">
            <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              {/* Search removed per request */}
            </div>
            </div>

            <div className="flex items-center gap-4 sm:gap-6">
              {/* Notification bell */}
              <button className="relative text-gray-500 hover:text-gray-700 transition">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {/* Luôn hiện chấm đỏ báo hiệu cho đẹp theo design */}
                <span className="absolute top-0 right-0.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
              </button>

              {/* Vertical Divider */}
              <div className="hidden sm:block h-8 w-px bg-gray-100"></div>

              {/* User Info & Avatar */}
              <div className="flex items-center gap-3">
                <div className="hidden sm:block">
                  <div className="text-base font-bold text-[#1e3a8a]">
                    {role || "Nhân viên"}
                  </div>
                </div>
                
                {/* Avatar Dropdown */}
                <div className="relative group">
                  <button className="relative flex items-center justify-center w-10 h-10 rounded-full bg-[#0d9488] text-white text-base font-bold ring-2 ring-transparent transition-all hover:ring-teal-200 focus:outline-none focus:ring-teal-200 shadow-sm border border-transparent">
                    {displayName ? displayName.charAt(0).toUpperCase() : "S"}
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                  </button>
                
                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 origin-top-right z-50">
                  <div className="py-2">
                    <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Quản lí hồ sơ
                    </button>
                    <div className="my-1 border-t border-gray-50"></div>
                    <button 
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                    >
                      <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Đăng xuất
                    </button>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-x-hidden overflow-y-auto px-3 py-4 sm:px-5 sm:py-5 lg:px-8 lg:py-6">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
