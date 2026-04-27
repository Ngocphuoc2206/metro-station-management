import { useState, useRef, useEffect } from "react";
import { AuditLogFilterParams } from "@features/auditLog/auditLogTypes";

interface Option {
  value: string;
  label: string;
}

function CustomSelect({
  value,
  onChange,
  options,
  icon
}: {
  value: string;
  onChange: (val: string) => void;
  options: Option[];
  icon?: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((o) => o.value === value) || options[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full ${icon ? "pl-9" : "pl-4"} pr-8 py-2.5 bg-white border text-left text-sm rounded-xl outline-none transition-colors flex items-center justify-between shadow-sm cursor-pointer ${
          isOpen ? "border-blue-500 ring-2 ring-blue-100" : "border-gray-300 hover:border-gray-400"
        }`}
      >
        {icon && (
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
            {icon}
          </div>
        )}
        <span className="text-gray-700 truncate">{selectedOption.label}</span>
        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400">
          <svg className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <ul className="max-h-60 overflow-y-auto custom-scrollbar py-1">
            {options.map((option) => (
              <li
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`px-4 py-2.5 text-sm cursor-pointer transition-colors flex items-center justify-between ${
                  value === option.value 
                    ? "bg-blue-50 text-blue-700 font-semibold" 
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {option.label}
                {value === option.value && (
                  <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

interface Props {
  filters: AuditLogFilterParams;
  setFilters: (f: AuditLogFilterParams) => void;
  onFilter: () => void;
}

export default function AuditLogFilter({ filters, setFilters, onFilter }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col md:flex-row items-end gap-4 shadow-sm">
      
      {/* Phạm vi thời gian */}
      <div className="flex-1 w-full relative">
        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Phạm vi thời gian</label>
        <CustomSelect
          value={filters.dateRange}
          onChange={(val) => setFilters({ ...filters, dateRange: val })}
          icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
          options={[
            { value: "today", label: "Hôm nay, 20 Tháng 5" },
            { value: "yesterday", label: "Hôm qua" },
            { value: "this_week", label: "Tuần này" },
            { value: "this_month", label: "Tháng này" },
            { value: "all", label: "Tất cả thời gian" },
          ]}
        />
      </div>

      {/* Người thực hiện */}
      <div className="flex-1 w-full relative z-30">
        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Người thực hiện</label>
        <CustomSelect
          value={filters.actor}
          onChange={(val) => setFilters({ ...filters, actor: val })}
          options={[
            { value: "all", label: "Tất cả quản trị viên" },
            { value: "admin", label: "Quản trị viên cấp cao" },
            { value: "system", label: "Hệ thống (System)" },
          ]}
        />
      </div>

      {/* Hành động */}
      <div className="flex-1 w-full relative z-20">
        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Hành động</label>
        <CustomSelect
          value={filters.action}
          onChange={(val) => setFilters({ ...filters, action: val })}
          options={[
            { value: "all", label: "Tất cả hành động" },
            { value: "CREATE", label: "Tạo mới (CREATE)" },
            { value: "UPDATE", label: "Cập nhật (UPDATE)" },
            { value: "DELETE", label: "Xóa (DELETE)" },
            { value: "LOGIN", label: "Đăng nhập (LOGIN)" },
          ]}
        />
      </div>

      {/* Button */}
      <button 
        onClick={onFilter}
        className="w-full md:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 flex-shrink-0"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        Lọc dữ liệu
      </button>

    </div>
  );
}
