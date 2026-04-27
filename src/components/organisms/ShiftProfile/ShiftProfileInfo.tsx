import { useSelector } from "react-redux";
import type { RootState } from "@stores/index";
import Image from "next/image";

export default function ShiftProfileInfo() {
  const { name } = useSelector((s: RootState) => s.userReducer);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <h2 className="text-base font-bold text-gray-900 mb-5">Thông tin nhân viên</h2>
      
      <div className="flex flex-col sm:flex-row items-center gap-5">
        <div className="w-20 h-20 rounded-2xl bg-emerald-100 overflow-hidden flex items-center justify-center flex-shrink-0">
          {/* Mock Avatar for display */}
          <div className="w-full h-full bg-emerald-200 relative">
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-16 bg-emerald-600 rounded-t-full" />
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-8 h-8 bg-[#fcd5ce] rounded-full" />
          </div>
        </div>

        <div className="text-center sm:text-left">
          <h3 className="text-xl font-bold text-gray-900 mb-1">{name || "Nguyễn Văn An"}</h3>
          <p className="text-sm font-medium text-gray-500 mb-2">Nhân viên vận hành cấp cao</p>
          <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Ga làm việc: Bến Thành
          </div>
        </div>
      </div>
    </div>
  );
}
