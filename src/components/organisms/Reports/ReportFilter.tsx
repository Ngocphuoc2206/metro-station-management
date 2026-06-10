/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect } from "react";

// Tái sử dụng ý tưởng CustomSelect (Ở thực tế nên tách ra file UI riêng)
function CustomSelect({
  value,
  onChange,
  options,
  icon,
}: {
  value: string;
  onChange: (v: string) => void;
  options: any[];
  icon?: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handle = (e: any) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const opt = options.find((o) => o.value === value) || options[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full ${icon ? "pl-9" : "pl-4"} pr-8 py-2.5 bg-gray-50 border text-left text-sm rounded-xl outline-none transition-colors flex items-center justify-between cursor-pointer ${
          isOpen
            ? "border-blue-500 ring-2 ring-blue-100"
            : "border-gray-200 hover:border-gray-300"
        }`}
      >
        {icon && (
          <div className="absolute inset-y-0 left-3 flex items-center text-gray-400">
            {icon}
          </div>
        )}
        <span className="text-gray-700 truncate font-semibold">
          {opt.label}
        </span>
        <div className="absolute inset-y-0 right-3 flex items-center text-gray-400">
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-100 rounded-xl shadow-lg z-50 overflow-hidden py-1">
          {options.map((o) => (
            <div
              key={o.value}
              onClick={() => {
                onChange(o.value);
                setIsOpen(false);
              }}
              className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-gray-50 flex items-center justify-between ${value === o.value ? "text-blue-600 font-bold bg-blue-50/50" : "text-gray-700"}`}
            >
              {o.label}
              {value === o.value && (
                <svg
                  className="w-4 h-4 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ReportFilter({ 
  onSearch,
  onExportExcel,
}: { 
  onSearch?: (filters: { date: string; station: string; channel: string }) => void;
  onExportExcel?: () => void;
}) {
  const [date, setDate] = useState("30d");
  const [station, setStation] = useState("all");
  const [channel, setChannel] = useState("all");

  const handleSearch = () => {
    onSearch?.({ date, station, channel });
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col md:flex-row items-end gap-5 shadow-sm">
      {/* Phạm vi thời gian */}
      <div className="flex-1 w-full relative">
        <label className="block text-[11px] font-bold text-blue-600 uppercase tracking-widest mb-2 ml-1">
          Phạm vi thời gian
        </label>
        <CustomSelect
          value={date}
          onChange={setDate}
          icon={
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          }
          options={[
            { value: "today", label: "Hôm nay" },
            { value: "7d", label: "7 ngày" },
            { value: "30d", label: "30 ngày" },
          ]}
        />
      </div>

      {/* Nhà Ga */}
      <div className="flex-1 w-full relative z-30">
        <label className="block text-[11px] font-bold text-blue-600 uppercase tracking-widest mb-2 ml-1">
          Nhà ga
        </label>
        <CustomSelect
          value={station}
          onChange={setStation}
          icon={
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          }
          options={[
            { value: "all", label: "Tất cả nhà ga" },
            { value: "btn", label: "Bến Thành" },
            { value: "bsn", label: "Ba Son" },
          ]}
        />
      </div>

      {/* Kênh Thanh Toán */}
      <div className="flex-1 w-full relative z-20">
        <label className="block text-[11px] font-bold text-blue-600 uppercase tracking-widest mb-2 ml-1">
          Kênh thanh toán
        </label>
        <CustomSelect
          value={channel}
          onChange={setChannel}
          icon={
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
          }
          options={[
            { value: "all", label: "Tất cả kênh" },
            { value: "cash", label: "Tiền mặt" },
            { value: "app", label: "Ứng dụng MetroNext" },
          ]}
        />
      </div>

      {/* Actions */}
      <div className="w-full md:w-auto flex items-center gap-3 flex-shrink-0">
        <button 
          onClick={handleSearch}
          className="flex-1 md:flex-none px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold border border-blue-600 text-sm rounded-xl shadow-sm transition-colors flex items-center justify-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Tìm kiếm
        </button>
        <button 
          onClick={onExportExcel}
          className="flex-1 md:flex-none px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-sm transition-colors flex items-center justify-center cursor-pointer"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Xuất báo cáo
        </button>
      </div>
    </div>
  );
}
