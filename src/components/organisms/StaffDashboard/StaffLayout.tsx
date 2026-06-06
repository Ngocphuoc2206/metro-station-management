import { ReactNode } from "react";
import StaffSidebar from "./StaffSidebar";

interface Props {
  children: ReactNode;
  wide?: boolean;
}

export default function StaffLayout({ children, wide = false }: Props) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <StaffSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-10 flex w-full items-center justify-between gap-3 border-b border-gray-100 bg-white px-3 py-3 sm:px-5 lg:px-8">
          <div className="flex-1" />

          <div className="ml-3 flex items-center gap-3 sm:gap-4">
            <button className="relative text-gray-400 hover:text-gray-700 transition">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white" />
            </button>
            <div className="flex items-center gap-3 border-l pl-4 border-gray-100">
              <div className="w-9 h-9 rounded-full bg-teal-600 flex items-center justify-center relative shadow-sm border border-gray-100">
                <span className="text-white text-xs font-bold">NA</span>
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-gray-50 p-3 sm:p-5 lg:p-6">
          <div className={`mx-auto w-full ${wide ? "max-w-[1480px]" : "max-w-[1200px]"}`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
