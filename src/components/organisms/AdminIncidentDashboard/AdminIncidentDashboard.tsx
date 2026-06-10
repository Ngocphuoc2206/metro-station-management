/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-img-element */
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { incidentApi } from "@features/incident/incidentApi";
import type { IncidentRecord } from "@features/incident/incidentTypes";
import { userApi } from "@features/user/userApi";
import type { User } from "@features/user/userTypes";
import { toast } from "react-hot-toast";
import CreateIncidentModal from "../IncidentDashboard/CreateIncidentModal";
import { stationApi } from "@features/station/stationApi";
import type { Station } from "@features/station/stationTypes";

// ── Badges ─────────────────────────────────────────────────────────────────────
function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    critical: { label: "Nguy cấp", cls: "bg-red-100 text-red-700 border border-red-200" },
    high: { label: "Cao", cls: "bg-orange-100 text-orange-700 border border-orange-200" },
    medium: { label: "Trung bình", cls: "bg-yellow-100 text-yellow-700 border border-yellow-200" },
    low: { label: "Thấp", cls: "bg-gray-100 text-gray-600 border border-gray-200" },
  };
  const v = map[severity] ?? map.low;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold ${v.cls}`}>
      {v.label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; dot: string; cls: string }> = {
    Open: { label: "Mới tạo", dot: "bg-gray-400", cls: "text-gray-600" },
    Approved: { label: "Đã phê duyệt", dot: "bg-blue-400", cls: "text-blue-700" },
    Assigned: { label: "Đã phân công", dot: "bg-blue-500", cls: "text-blue-700" },
    InProgress: { label: "Đang xử lý", dot: "bg-orange-500", cls: "text-orange-700" },
    Escalated: { label: "Đang xử lý", dot: "bg-orange-500", cls: "text-orange-700" },
    Resolved: { label: "Đã hoàn thành", dot: "bg-green-500", cls: "text-green-700" },
    Closed: { label: "Đã đóng", dot: "bg-slate-500", cls: "text-slate-600" },
  };
  const v = map[status] ?? map.Open;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${v.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${v.dot}`} />
      {v.label}
    </span>
  );
}

function toShortCode(id: string) {
  const match = id.match(/\d+/);
  return match ? `SC${String(parseInt(match[0], 10)).padStart(3, "0")}` : id.slice(0, 6).toUpperCase();
}

// ── Incident Detail Modal ───────────────────────────────────────────────────────
function IncidentDetailModal({
  incident,
  staffList,
  onClose,
  onSave,
  onCloseIncident,
  onReopenIncident,
  actionLoading,
  getStationName,
}: {
  incident: IncidentRecord;
  staffList: User[];
  onClose: () => void;
  onSave: (incidentId: string, staffId: string) => Promise<void>;
  onCloseIncident: (incidentId: string) => Promise<void>;
  onReopenIncident: (incidentId: string) => Promise<void>;
  actionLoading: boolean;
  getStationName: (stationId: string) => string;
}) {
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [detail, setDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const shortCode = toShortCode(incident.id);

  useEffect(() => {
    let active = true;
    async function fetchDetail() {
      setLoadingDetail(true);
      try {
        const d = await incidentApi.getIncidentById(incident.id);
        if (active) setDetail(d);
      } catch (err1) {
        console.warn("Failed to get incident detail via staff endpoint, trying admin endpoint:", err1);
        try {
          const d = await incidentApi.getIncidentByIdAdmin(incident.id);
          if (active) setDetail(d);
        } catch (err2) {
          console.error("Lỗi lấy chi tiết sự cố:", err2);
          if (active) setDetail(incident);
        }
      } finally {
        if (active) setLoadingDetail(false);
      }
    }
    fetchDetail();
    return () => {
      active = false;
    };
  }, [incident]);

  const staffReport = useMemo(() => {
    if (!detail || !detail.comments) return { note: "Không có ghi chú.", images: [] as string[] };

    // Tìm các bình luận từ comments list
    const comments = detail.comments || [];
    if (comments.length === 0) return { note: "Không có ghi chú.", images: [] as string[] };

    // Tìm bình luận chứa thông tin báo cáo khắc phục của nhân viên
    // (Bỏ qua các bình luận hệ thống bắt đầu bằng "[")
    let reportComment = "";
    const foundWithImages = [...comments].reverse().find((c: any) => c.content?.includes("Hình ảnh bằng chứng xử lý:"));
    if (foundWithImages) {
      reportComment = foundWithImages.content || "";
    } else {
      const userComments = comments.filter((c: any) => c.content && !c.content.trim().startsWith("["));
      if (userComments.length > 0) {
        reportComment = userComments[userComments.length - 1].content || "";
      } else {
        reportComment = comments[comments.length - 1].content || "";
      }
    }

    const lines = reportComment.split("\n");
    const imageUrls: string[] = [];
    const noteLines: string[] = [];

    let parsingImages = false;
    for (const line of lines) {
      if (line.includes("Hình ảnh bằng chứng xử lý:")) {
        parsingImages = true;
        continue;
      }
      if (parsingImages) {
        const trimmed = line.trim();
        if (trimmed.startsWith("http") || trimmed.startsWith("data:")) {
          imageUrls.push(trimmed);
        } else if (trimmed) {
          noteLines.push(line);
        }
      } else {
        noteLines.push(line);
      }
    }

    return {
      note: noteLines.join("\n").trim() || "Không có ghi chú.",
      images: imageUrls,
    };
  }, [detail]);

  const isResolvedOrClosed = incident.status === "Resolved" || incident.status === "Closed";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full mx-auto overflow-hidden transition-all ${isResolvedOrClosed ? "max-w-2xl" : "max-w-lg"}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          {isResolvedOrClosed ? (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-base">
                  {incident.status === "Closed" ? "Chi tiết sự cố đã đóng" : "Chi tiết sự cố đã hoàn thành"} - {shortCode}
                </h2>
                <p className="text-[10px] text-gray-400">
                  Hoàn thành lúc {incident.updatedAt ? (() => {
                    const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(incident.updatedAt);
                    const matchTime = incident.updatedAt.match(/^(\d{4})[./-](\d{2})[./-](\d{2})[T ](\d{2}):(\d{2}):(\d{2})/);
                    if (matchTime && !hasTimezone) {
                      const year = parseInt(matchTime[1], 10);
                      const month = parseInt(matchTime[2], 10) - 1;
                      const day = parseInt(matchTime[3], 10);
                      const hour = parseInt(matchTime[4], 10);
                      const minute = parseInt(matchTime[5], 10);
                      const second = parseInt(matchTime[6], 10);
                      const date = new Date(Date.UTC(year, month, day, hour, minute, second));
                      return date.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
                    }
                    const normalized = hasTimezone ? incident.updatedAt : `${incident.updatedAt}Z`;
                    return new Date(normalized).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
                  })() : "14:30, 25/10/2023"}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="font-bold text-gray-900 text-base">Chi tiết sự cố {shortCode}</h2>
            </div>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
          {isResolvedOrClosed ? (
            <>
              {/* Completed Layout Grid (like Image 1) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-gray-100 rounded-xl p-4 bg-white shadow-sm">
                  <p className="text-xs text-gray-400 font-semibold mb-1">Tiêu đề</p>
                  <p className="font-semibold text-gray-900 text-sm leading-snug">{incident.title}</p>
                </div>
                <div className="border border-gray-100 rounded-xl p-4 bg-white shadow-sm">
                  <p className="text-xs text-gray-400 font-semibold mb-1">Vị trí & Thiết bị</p>
                  <p className="font-semibold text-gray-900 text-sm leading-snug">
                    {incident.stationName || getStationName(incident.stationId)}
                    {incident.deviceId ? ` - Thiết bị: ${incident.deviceId}` : ""}
                  </p>
                </div>
                <div className="border border-gray-100 rounded-xl p-4 bg-white shadow-sm">
                  <p className="text-xs text-gray-400 font-semibold mb-1">Mức độ nghiêm trọng</p>
                  <div className="flex items-center gap-1.5 font-bold text-gray-900 text-sm mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    {incident.severity === "critical" ? "Nguy cấp" : incident.severity === "high" ? "Cao" : incident.severity === "medium" ? "Trung bình" : "Thấp"}
                  </div>
                </div>
                <div className="border border-gray-100 rounded-xl p-4 bg-white shadow-sm">
                  <p className="text-xs text-gray-400 font-semibold mb-1">Người xử lý</p>
                  <div className="flex items-center gap-1.5 font-bold text-gray-900 text-sm mt-0.5">
                    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>{incident.assigneeName || "Không rõ"}</span>
                  </div>
                </div>
              </div>

              {/* Tóm tắt xử lý */}
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
                <div className="flex items-center gap-1.5 text-blue-700 font-bold text-xs uppercase tracking-wider mb-2">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Tóm tắt xử lý
                </div>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {loadingDetail ? "Đang tải dữ liệu tóm tắt..." : staffReport.note}
                </p>
              </div>

              {/* Bằng chứng hoàn thành */}
              {!loadingDetail && staffReport.images.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Bằng chứng hoàn thành</p>
                  <div className="space-y-3">
                    {staffReport.images.map((src, i) => (
                      <div key={i} className="rounded-xl overflow-hidden border border-gray-100 shadow-sm max-h-[300px] flex items-center justify-center bg-gray-50">
                        <img src={src} alt={`evidence-${i + 1}`} className="w-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Info grid */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Mã sự cố</p>
                  <p className="font-bold text-blue-600">{shortCode}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Nhà ga</p>
                  <p className="font-medium text-gray-800 break-all text-xs">{getStationName(incident.stationId)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Tên sự cố</p>
                  <p className="font-semibold text-gray-900">{incident.title}</p>
                </div>
              </div>

              {/* Description */}
              {incident.description && (
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1.5">Mô tả chi tiết</p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-xl px-4 py-3 leading-relaxed">
                    {incident.description}
                  </p>
                </div>
              )}

              {/* Severity + Status */}
              <div className="flex items-center gap-8">
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1.5">Mức độ</p>
                  <SeverityBadge severity={incident.severity} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1.5">Trạng thái hiện tại</p>
                  <StatusBadge status={incident.status} />
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Staff assignment */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Nhân viên xử lý</p>
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition cursor-pointer"
                >
                  <option value="">Chọn nhân viên...</option>
                  {staffList.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
                {incident.assigneeName && (
                  <p className="text-xs text-gray-400 mt-1.5">
                    Hiện tại:{" "}
                    <span className="font-semibold text-gray-600">{incident.assigneeName}</span>
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {incident.status === "Resolved" ? (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/60 flex-nowrap overflow-x-auto">
            <button
              onClick={onClose}
              disabled={actionLoading}
              className="px-4 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition whitespace-nowrap"
            >
              Hủy
            </button>
            <button
              onClick={() => onReopenIncident(incident.id)}
              disabled={actionLoading}
              className="px-4 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl disabled:opacity-50 transition whitespace-nowrap"
            >
              Nghiệm thu lỗi - Yêu cầu sửa lại
            </button>
            <button
              onClick={() => onCloseIncident(incident.id)}
              disabled={actionLoading}
              className="px-4 py-2.5 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl disabled:opacity-50 transition whitespace-nowrap"
            >
              Nghiệm thu đạt - Đóng sự cố
            </button>
          </div>
        ) : incident.status === "Closed" ? (
          <div className="flex items-center justify-end px-6 py-4 border-t border-gray-100 bg-gray-50/60">
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition"
            >
              Đóng
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/60">
            <button
              onClick={onClose}
              disabled={actionLoading}
              className="px-5 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition"
            >
              Hủy
            </button>
            <button
              onClick={() => onSave(incident.id, selectedStaffId)}
              disabled={actionLoading}
              className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-60 transition"
            >
              {actionLoading ? (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              Lưu thay đổi
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function AdminIncidentDashboard() {
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [selectedIncident, setSelectedIncident] = useState<IncidentRecord | null>(null);
  const [staffList, setStaffList] = useState<User[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [stations, setStations] = useState<Station[]>([]);

  useEffect(() => {
    loadIncidents();
    userApi
      .getUsers()
      .then((users) => setStaffList(users.filter((u) => u.role === "staff" || u.role === "admin")))
      .catch(() => setStaffList([]));
    stationApi
      .getAdminStations()
      .then((data) => setStations(data))
      .catch((err) => console.error("Failed to load stations", err));
  }, []);

  const getStationName = useCallback((stationId: string) => {
    const station = stations.find((s) => s.id === stationId);
    return station ? station.name : stationId || "—";
  }, [stations]);

  async function loadIncidents() {
    setLoading(true);
    try {
      const data = await incidentApi.getIncidents({} as any);
      setIncidents(data);
    } catch (e) {
      console.error("Failed to load incidents", e);
    } finally {
      setLoading(false);
    }
  }

  // Lưu thay đổi: gọi approve API (PATCH /staff/incidents/{id}/approve)
  // Backend tự gán nhân viên, trả về assigneeName trong response
  const handleSave = useCallback(async (incidentId: string, _staffId: string) => {
    void _staffId;
    setActionLoading(true);
    try {
      const updated = await incidentApi.approveIncident(incidentId);
      toast.success("Đã phê duyệt sự cố thành công!");

      // Update local list with response data
      setIncidents((prev) =>
        prev.map((i) =>
          i.id === incidentId
            ? {
              ...i,
              status: updated.status ?? ("Approved" as any),
              assigneeName: updated.assigneeName ?? i.assigneeName,
            }
            : i,
        ),
      );
      setSelectedIncident(null);
    } catch (e: any) {
      toast.error(e.message || "Lỗi phê duyệt sự cố!");
    } finally {
      setActionLoading(false);
    }
  }, []);

  const handleCloseIncident = useCallback(async (id: string) => {
    setActionLoading(true);
    try {
      await incidentApi.closeIncident(id);
      toast.success("Nghiệm thu đạt - Đã đóng sự cố!");
      setIncidents((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: "Closed" as any } : i))
      );
      setSelectedIncident(null);
    } catch (e: any) {
      toast.error(e.message || "Lỗi đóng sự cố!");
    } finally {
      setActionLoading(false);
    }
  }, []);

  const handleReopenIncident = useCallback(async (id: string) => {
    setActionLoading(true);
    try {
      await incidentApi.reopenIncident(id);
      toast.success("Nghiệm thu lỗi - Yêu cầu sửa lại!");
      setIncidents((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: "Approved" as any } : i))
      );
      setSelectedIncident(null);
    } catch (e: any) {
      toast.error(e.message || "Lỗi yêu cầu sửa lại!");
    } finally {
      setActionLoading(false);
    }
  }, []);

  const handleDeleteIncident = async (incident: IncidentRecord) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa sự cố "${incident.title}"?`)) {
      return;
    }
    try {
      await incidentApi.deleteIncident(incident.id);
      setIncidents((current) => current.filter((i) => i.id !== incident.id));
      toast.success("Đã xóa sự cố.");
    } catch {
      toast.error("Không thể xóa sự cố.");
    }
  };

  const stats = useMemo(() => {
    const total = incidents.length;
    const pending = incidents.filter((i) => i.status === "Open").length;
    const inProgress = incidents.filter(
      (i) => i.status === "InProgress" || i.status === "Escalated" || i.status === "Assigned",
    ).length;
    const resolved = incidents.filter(
      (i) => i.status === "Resolved" || i.status === "Closed",
    ).length;
    return { total, pending, inProgress, resolved };
  }, [incidents]);

  const filtered = useMemo(() => {
    let list = incidents;
    if (statusFilter !== "all") list = list.filter((i) => i.status === statusFilter);
    if (severityFilter !== "all") list = list.filter((i) => i.severity === severityFilter);
    if (appliedSearch.trim()) {
      const q = appliedSearch.toLowerCase();
      list = list.filter(
        (i) =>
          toShortCode(i.id).toLowerCase().includes(q) ||
          i.title.toLowerCase().includes(q) ||
          (i.assigneeName ?? "").toLowerCase().includes(q) ||
          (i.stationId ?? "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [incidents, appliedSearch, statusFilter, severityFilter]);

  return (
    <div className="flex flex-col space-y-6 w-full">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-gray-500 font-medium">
        <span>Admin</span>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-blue-600 font-semibold">Duyệt sự cố</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Duyệt sự cố</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Tổng sự cố", value: stats.total, color: "blue", icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
          { label: "Chờ xử lý", value: stats.pending, color: "gray", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
          { label: "Đang xử lý", value: stats.inProgress, color: "orange", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
          { label: "Hoàn thành", value: stats.resolved, color: "green", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm">
            <div className={`w-10 h-10 rounded-full bg-${s.color}-50 flex items-center justify-center shrink-0`}>
              <svg className={`w-5 h-5 text-${s.color}-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
              </svg>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{s.label}</div>
              <div className="text-2xl font-black text-gray-900">{loading ? "—" : s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar + Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") setAppliedSearch(searchQuery); }}
              placeholder="Tìm mã SC, tên sự cố, nhân viên..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition bg-gray-50"
            />
          </div>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 w-auto min-w-[130px]"
          >
            <option value="all">Mức độ</option>
            <option value="critical">Nguy cấp</option>
            <option value="high">Cao</option>
            <option value="medium">Trung bình</option>
            <option value="low">Thấp</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 w-auto min-w-[140px]"
          >
            <option value="all">Trạng thái</option>
            <option value="Open">Mới tạo</option>
            <option value="Approved">Đã phê duyệt</option>
            <option value="Assigned">Đã phân công</option>
            <option value="InProgress">Đang xử lý</option>
            <option value="Resolved">Đã hoàn thành</option>
            <option value="Closed">Đã đóng</option>
          </select>
          <button
            onClick={() => setAppliedSearch(searchQuery)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Tìm kiếm
          </button>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition shadow-sm shadow-blue-100 whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Tạo sự cố mới
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-5 py-3">Mã SC</th>
                <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-4 py-3">Tên sự cố</th>
                <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-4 py-3">Nhà ga</th>
                <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-4 py-3">Mức độ</th>
                <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-4 py-3">Nhân viên</th>
                <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-4 py-3">Trạng thái</th>
                <th className="text-center text-xs font-bold text-gray-400 uppercase tracking-wider px-4 py-3 w-[120px]">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
                : filtered.length === 0
                  ? (
                    <tr>
                      <td colSpan={7} className="text-center py-16 text-gray-400 text-sm">
                        Không tìm thấy sự cố nào
                      </td>
                    </tr>
                  )
                  : filtered.map((inc) => {
                    const code = toShortCode(inc.id);
                    return (
                      <tr key={inc.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-5 py-4">
                          <span className="font-bold text-blue-600">{code}</span>
                        </td>
                        <td className="px-4 py-4 max-w-[200px]">
                          <span className="font-semibold text-gray-900 truncate block">{inc.title}</span>
                        </td>
                        <td className="px-4 py-4 text-gray-500 text-xs max-w-[140px] truncate">{getStationName(inc.stationId)}</td>
                        <td className="px-4 py-4">
                          <SeverityBadge severity={inc.severity} />
                        </td>
                        <td className="px-4 py-4">
                          {inc.assigneeName ? (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-700 shrink-0">
                                {inc.assigneeName.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-gray-700 text-xs">{inc.assigneeName}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs italic">Chưa phân công</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <StatusBadge status={inc.status} />
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex justify-center gap-3">
                            <button
                              type="button"
                              onClick={() => setSelectedIncident(inc)}
                              disabled={inc.status === "Approved"}
                              className={`${
                                inc.status === "Approved"
                                  ? "text-gray-200 cursor-not-allowed"
                                  : "text-gray-400 hover:text-blue-600"
                              } transition`}
                              title={inc.status === "Approved" ? "Sự cố đã được duyệt" : "Chi tiết / Duyệt"}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteIncident(inc)}
                              className="text-gray-400 hover:text-red-500 transition"
                              title="Xóa"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>

        {!loading && (
          <div className="px-5 py-3 border-t border-gray-50 text-xs text-gray-400">
            Hiển thị {filtered.length} / {incidents.length} sự cố
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedIncident && (
        <IncidentDetailModal
          incident={selectedIncident}
          staffList={staffList}
          onClose={() => setSelectedIncident(null)}
          onSave={handleSave}
          onCloseIncident={handleCloseIncident}
          onReopenIncident={handleReopenIncident}
          actionLoading={actionLoading}
          getStationName={getStationName}
        />
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <CreateIncidentModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            loadIncidents();
          }}
        />
      )}
    </div>
  );
}