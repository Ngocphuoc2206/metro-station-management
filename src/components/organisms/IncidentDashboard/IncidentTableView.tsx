import React, { useState } from "react";
import type { IncidentRecord } from "@features/incident/incidentTypes";

interface Props {
  incidents: IncidentRecord[];
  loading: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onViewDetail: (incident: IncidentRecord) => void;
}

const PAGE_SIZE = 10;

// Generate short code like SC001 from incident id
function toShortCode(id: string, idx: number): string {
  const match = id.match(/\d+/);
  if (match) {
    const num = parseInt(match[0], 10);
    return `SC${String(num).padStart(3, "0")}`;
  }
  return `SC${String(idx + 1).padStart(3, "0")}`;
}

function getSeverityBadge(severity: string) {
  switch (severity) {
    case "critical":
      return (
        <span className="inline-flex items-center whitespace-nowrap px-2.5 py-1 rounded-md text-xs font-bold bg-red-100 text-red-700">
          Nguy cấp
        </span>
      );
    case "high":
      return (
        <span className="inline-flex items-center whitespace-nowrap px-2.5 py-1 rounded-md text-xs font-bold bg-orange-100 text-orange-700">
          Cao
        </span>
      );
    case "medium":
      return (
        <span className="inline-flex items-center whitespace-nowrap px-2.5 py-1 rounded-md text-xs font-bold bg-yellow-100 text-yellow-700">
          Trung bình
        </span>
      );
    case "low":
      return (
        <span className="inline-flex items-center whitespace-nowrap px-2.5 py-1 rounded-md text-xs font-bold bg-gray-100 text-gray-600">
          Thấp
        </span>
      );
    default:
      return null;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "Open":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
          Tạo mới
        </span>
      );
    case "Assigned":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          Đã phân công
        </span>
      );
    case "InProgress":
    case "Escalated":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-600">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
          Đang xử lý
        </span>
      );
    case "Resolved":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          Đã hoàn thành
        </span>
      );
    case "Closed":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          Đã đóng
        </span>
      );
    default:
      return null;
  }
}

function AssigneeAvatar({ name }: { name?: string }) {
  if (!name) {
    return (
      <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
    );
  }
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0].toUpperCase())
    .join("");

  // Deterministic color based on name
  const colors = [
    "bg-blue-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-cyan-500",
    "bg-violet-500",
  ];
  const colorIdx = name.charCodeAt(0) % colors.length;

  return (
    <div className={`w-8 h-8 rounded-full ${colors[colorIdx]} text-white text-xs font-bold flex items-center justify-center shrink-0`}>
      {initials}
    </div>
  );
}

export default function IncidentTableView({
  incidents,
  loading,
  searchQuery,
  onSearchChange,
  onViewDetail,
}: Props) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(incidents.length / PAGE_SIZE));
  const paginated = incidents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset page when search changes
  React.useEffect(() => {
    setPage(1);
  }, [searchQuery, incidents.length]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Search Bar */}
      <div className="px-6 py-4 border-b border-gray-50">
        <div className="relative">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Tìm kiếm mã sự cố, tên nhân viên..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition placeholder-gray-400"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              <th className="px-6 py-3.5 text-[11px] font-black text-gray-400 uppercase tracking-wider">Mã sự cố</th>
              <th className="px-6 py-3.5 text-[11px] font-black text-gray-400 uppercase tracking-wider">Tên sự cố</th>
              <th className="px-6 py-3.5 text-[11px] font-black text-gray-400 uppercase tracking-wider">Mô tả chi tiết</th>
              <th className="px-6 py-3.5 text-[11px] font-black text-gray-400 uppercase tracking-wider">Mức độ</th>
              <th className="px-6 py-3.5 text-[11px] font-black text-gray-400 uppercase tracking-wider">Nhân viên</th>
              <th className="px-6 py-3.5 text-[11px] font-black text-gray-400 uppercase tracking-wider">Trạng thái</th>
              <th className="px-6 py-3.5 text-[11px] font-black text-gray-400 uppercase tracking-wider text-right whitespace-nowrap">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-6 py-4">
                      <div className="h-4 bg-gray-100 rounded animate-pulse w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-400 font-medium">
                  Không tìm thấy sự cố nào.
                </td>
              </tr>
            ) : (
              paginated.map((incident, idx) => {
                const shortCode = toShortCode(incident.id, (page - 1) * PAGE_SIZE + idx);
                const descPreview = incident.description
                  ? incident.description.length > 50
                    ? incident.description.slice(0, 50) + "..."
                    : incident.description
                  : "—";

                return (
                  <tr
                    key={incident.id}
                    className="hover:bg-gray-50/60 transition-colors"
                  >
                    {/* Mã sự cố */}
                    <td className="px-6 py-4">
                      <button
                        onClick={() => onViewDetail(incident)}
                        className="text-blue-600 font-bold hover:underline hover:text-blue-700 transition-colors"
                      >
                        {shortCode}
                      </button>
                    </td>

                    {/* Tên sự cố */}
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-900">{incident.title}</span>
                    </td>

                    {/* Mô tả chi tiết */}
                    <td className="px-6 py-4 max-w-xs">
                      <span className="text-gray-500 text-sm">{descPreview}</span>
                    </td>

                    {/* Mức độ */}
                    <td className="px-6 py-4 whitespace-nowrap">{getSeverityBadge(incident.severity)}</td>

                    {/* Nhân viên */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <AssigneeAvatar name={incident.assigneeName} />
                        <span className="text-gray-700 font-medium text-sm whitespace-nowrap">
                          {incident.assigneeName ?? "—"}
                        </span>
                      </div>
                    </td>

                    {/* Trạng thái */}
                    <td className="px-6 py-4">{getStatusBadge(incident.status)}</td>

                    {/* Thao tác */}
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => onViewDetail(incident)}
                        className="text-blue-600 font-semibold hover:text-blue-800 transition-colors text-sm"
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer: count + pagination */}
      {!loading && incidents.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-50 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Hiển thị {Math.min((page - 1) * PAGE_SIZE + 1, incidents.length)}–{Math.min(page * PAGE_SIZE, incidents.length)} trên tổng số{" "}
            <span className="font-semibold text-gray-700">{incidents.length}</span> sự cố
          </span>

          {/* Pagination */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | "...")[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "..." ? (
                  <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-gray-400 text-sm">
                    ...
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-semibold transition ${
                      page === p
                        ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {p}
                  </button>
                ),
              )}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
