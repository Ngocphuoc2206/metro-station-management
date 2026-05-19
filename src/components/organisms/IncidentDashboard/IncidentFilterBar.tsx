/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import type { IncidentFilterParams } from "@features/incident/incidentTypes";

interface Props {
  viewMode: "kanban" | "table";
  onChangeView: (mode: "kanban" | "table") => void;
  filters: IncidentFilterParams;
  onFilterChange: (filters: IncidentFilterParams) => void;
  onOpenCreate: () => void;
}

export default function IncidentFilterBar({
  viewMode,
  onChangeView,
  filters,
  onFilterChange,
  onOpenCreate,
}: Props) {
  return (
    <div className="space-y-6">
      {/* Top Header: Title + Toggle + Create Btn */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 font-medium pb-2">
            <span>Nhân viên ga</span>
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
            <span className="text-blue-600 font-bold">Sự cố</span>
          </div>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              Quản lý sự cố
            </h1>

            {/* Toggle View */}
            <div className="bg-gray-100 p-1 rounded-xl flex items-center shrink-0 ml-4 border border-gray-200/60">
              <button
                type="button"
                onClick={() => onChangeView("kanban")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
                  viewMode === "kanban"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                  />
                </svg>
                Kanban
              </button>
              <button
                type="button"
                onClick={() => onChangeView("table")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
                  viewMode === "table"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 10h16M4 14h16M4 18h16"
                  />
                </svg>
                Bảng
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={onOpenCreate}
          className="bg-blue-600 text-white flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
          Tạo sự cố
        </button>
      </div>

      {/* Filter Row */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap gap-4 items-end justify-between">
        <div className="flex flex-wrap gap-4 flex-1">
          <div className="w-40">
            <label className="block text-[10px] font-bold text-gray-400 tracking-wider mb-1 uppercase">
              Nhà ga
            </label>
            <select
              value={filters.stationId || "all"}
              onChange={(e) =>
                onFilterChange({ ...filters, stationId: e.target.value })
              }
              className="w-full bg-gray-50 border border-gray-100 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-2.5 font-medium outline-none"
            >
              <option value="all">Tất cả ga</option>
              <option value="G-STN-001">Bến Thành</option>
              <option value="G-STN-002">Nhà Hát Thành Phố</option>
              <option value="G-STN-010">Suối Tiên</option>
              <option value="T-STN-003">Bình Thái</option>
            </select>
          </div>

          <div className="w-40">
            <label className="block text-[10px] font-bold text-gray-400 tracking-wider mb-1 uppercase">
              Loại thiết bị
            </label>
            <select
              value={filters.deviceType || "all"}
              onChange={(e) =>
                onFilterChange({ ...filters, deviceType: e.target.value })
              }
              className="w-full bg-gray-50 border border-gray-100 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-2.5 font-medium outline-none"
            >
              <option value="all">Tất cả thiết bị</option>
              <option value="gate">Cổng soát vé</option>
              <option value="tvm">Máy bán vé TVM</option>
              <option value="led">Màn hình LED</option>
            </select>
          </div>

          <div className="w-40">
            <label className="block text-[10px] font-bold text-gray-400 tracking-wider mb-1 uppercase">
              Mức độ
            </label>
            <select
              value={filters.severity || "all"}
              onChange={(e) =>
                onFilterChange({ ...filters, severity: e.target.value as any })
              }
              className="w-full bg-gray-50 border border-gray-100 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-2.5 font-medium outline-none"
            >
              <option value="all">Tất cả mức độ</option>
              <option value="critical">Nghiêm trọng</option>
              <option value="high">Cao</option>
              <option value="medium">Trung bình</option>
              <option value="low">Thấp</option>
            </select>
          </div>
        </div>

        <button className="bg-white border border-gray-200 text-gray-700 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors">
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          Bộ lọc khác
        </button>
      </div>
    </div>
  );
}
