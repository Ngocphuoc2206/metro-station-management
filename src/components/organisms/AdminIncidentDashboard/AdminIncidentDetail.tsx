/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { incidentApi } from "@features/incident/incidentApi";
import type { IncidentDetailRecord, IncidentStatus } from "@features/incident/incidentTypes";
import { userApi } from "@features/user/userApi";
import type { User } from "@features/user/userTypes";
import { toast } from "react-hot-toast";
function toShortCode(id: string) {
  const match = id.match(/\d+/);
  return match ? `SC${String(parseInt(match[0], 10)).padStart(3, "0")}` : id.slice(0, 6).toUpperCase();
}
const SEVERITY_LABEL: Record<string, string> = {
  critical: "Nguy cấp", high: "Cao", medium: "Trung bình", low: "Thấp",
};
const SEVERITY_CLS: Record<string, string> = {
  critical: "bg-red-100 text-red-700 border-red-200",
  high:     "bg-orange-100 text-orange-700 border-orange-200",
  medium:   "bg-yellow-100 text-yellow-700 border-yellow-200",
  low:      "bg-gray-100 text-gray-600 border-gray-200",
};
const STATUS_LABEL: Record<string, string> = {
  Open: "Mới tạo", Approved: "Đã phê duyệt", Assigned: "Đã phân công", InProgress: "Đang xử lý",
  Escalated: "Đang xử lý", Resolved: "Đã hoàn thành", Closed: "Đã đóng",
};
const STATUS_CLS: Record<string, string> = {
  Open: "bg-gray-100 text-gray-700", Approved: "bg-blue-100 text-blue-700", Assigned: "bg-blue-100 text-blue-700",
  InProgress: "bg-orange-100 text-orange-700", Escalated: "bg-orange-100 text-orange-700",
  Resolved: "bg-green-100 text-green-700", Closed: "bg-slate-100 text-slate-600",
};
export default function AdminIncidentDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [incident, setIncident] = useState<IncidentDetailRecord | null>(null);
  const [staffList, setStaffList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [comment, setComment] = useState("");
  useEffect(() => {
    if (id && typeof id === "string") fetchIncident(id);
  }, [id]);
  useEffect(() => {
    userApi
      .getUsers()
      .then((users) => setStaffList(users.filter((u) => u.role === "staff" || u.role === "admin")))
      .catch(() =>
        setStaffList([
          { id: "staff-1", name: "Nguyễn Văn An",  email: "an@metro.com",   role: "staff", status: "active" },
          { id: "staff-2", name: "Lê Văn Tuấn",    email: "tuan@metro.com", role: "staff", status: "active" },
          { id: "admin-1", name: "Trần Minh",       email: "minh@metro.com", role: "admin", status: "active" },
        ] as User[]),
      );
  }, []);
  async function fetchIncident(incidentId: string) {
    try {
      setLoading(true);
      setIncident(await incidentApi.getIncidentByIdAdmin(incidentId));
    } catch (e: any) {
      toast.error(e.message || "Lỗi tải dữ liệu sự cố");
    } finally {
      setLoading(false);
    }
  }
  const handleAssign = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!incident) return;
    const staffId = e.target.value;
    const staff = staffList.find((u) => u.id === staffId);
    if (!staffId || !staff) return;
    try {
      setActionLoading(true);
      await incidentApi.assignIncident(incident.id, staffId);
      toast.success(`Đã phân công cho ${staff.name}`);
      await fetchIncident(incident.id);
    } catch (e: any) {
      toast.error(e.message || "Lỗi phân công!");
    } finally {
      setActionLoading(false);
    }
  };
  const handleUpdateStatus = async (newStatus: IncidentStatus) => {
    if (!incident) return;
    try {
      setActionLoading(true);
      await incidentApi.updateIncidentStatus(incident.id, newStatus);
      toast.success("Đã cập nhật trạng thái");
      await fetchIncident(incident.id);
    } catch (e: any) {
      toast.error(e.message || "Lỗi cập nhật trạng thái");
    } finally {
      setActionLoading(false);
    }
  };
  const handleApprove = async () => {
    if (!incident) return;
    try {
      setActionLoading(true);
      const updated = await incidentApi.approveIncident(incident.id);
      toast.success("Đã phê duyệt sự cố thành công!");
      // Optimistically update local state so UI reflects immediately
      setIncident((prev) =>
        prev
          ? {
              ...prev,
              status: "Approved" as IncidentStatus,
              assigneeName: updated.assigneeName || prev.assigneeName,
            }
          : prev
      );
    } catch (e: any) {
      toast.error(e.message || "Lỗi phê duyệt sự cố!");
    } finally {
      setActionLoading(false);
    }
  };
  const handlePostComment = async () => {
    if (!incident || !comment.trim()) return;
    try {
      setActionLoading(true);
      await incidentApi.addTimelineComment(incident.id, comment.trim());
      toast.success("Đã gửi ghi chú");
      setComment("");
      await fetchIncident(incident.id);
    } catch {
      toast.error("Lỗi gửi ghi chú");
    } finally {
      setActionLoading(false);
    }
  };
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }
  if (!incident) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 mb-4">Không tìm thấy sự cố</p>
        <button onClick={() => router.push("/admin/incidents")} className="text-blue-600 hover:underline text-sm font-semibold">
          ← Quay lại danh sách
        </button>
      </div>
    );
  }
  const shortCode = toShortCode(incident.id);
  const canAssign = incident.status === "Open" || incident.status === "Assigned" || incident.status === "InProgress";
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-gray-500">
        <Link href="/dashboard/admin" className="hover:text-blue-600 transition">Admin</Link>
        <span>›</span>
        <Link href="/admin/incidents" className="hover:text-blue-600 transition">Duyệt sự cố</Link>
        <span>›</span>
        <span className="font-semibold text-gray-900">{shortCode}</span>
      </div>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">{incident.title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{shortCode} • {incident.stationId}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${SEVERITY_CLS[incident.severity]}`}>
            {SEVERITY_LABEL[incident.severity] ?? incident.severity}
          </span>
          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${STATUS_CLS[incident.status]}`}>
            • {STATUS_LABEL[incident.status] ?? incident.status}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left (2/3) ── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Info card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
            <h3 className="font-bold text-gray-900">Thông tin sự cố</h3>
            <div className="grid grid-cols-2 gap-5 text-sm">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Mã sự cố</p>
                <p className="font-bold text-blue-600">{shortCode}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Nhà ga</p>
                <p className="font-semibold text-gray-900">{incident.stationId || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Thiết bị</p>
                <p className="font-semibold text-gray-900">{incident.deviceId || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Nhân viên phụ trách</p>
                <p className="font-semibold text-gray-900">{incident.assigneeName || "Chưa phân công"}</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Mô tả chi tiết</p>
              <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-4">
                {incident.description || "Không có mô tả."}
              </p>
            </div>
          </div>
          {/* Timeline */}
          {incident.timeline && incident.timeline.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4">Lịch sử xử lý</h3>
              <div className="space-y-4">
                {incident.timeline.map((ev, i) => (
                  <div key={ev.id ?? i} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                      <span className="text-blue-700 text-xs font-bold">
                        {(ev.actorName ?? "?").charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-900">{ev.actorName}</span>
                        <span className="text-xs text-gray-400">{ev.timestamp ? new Date(ev.timestamp).toLocaleString("vi-VN") : ""}</span>
                      </div>
                      {ev.content && <p className="text-sm text-gray-600 mt-0.5">{ev.content}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Comment box */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-3">Ghi chú / Phản hồi</h3>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="Nhập ghi chú hoặc hướng dẫn xử lý cho nhân viên..."
              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition resize-none placeholder-gray-400"
            />
            <div className="flex justify-end mt-3">
              <button
                onClick={handlePostComment}
                disabled={actionLoading || !comment.trim()}
                className="px-5 py-2 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition"
              >
                Gửi ghi chú
              </button>
            </div>
          </div>
        </div>
        {/* ── Right (1/3) ── */}
        <div className="space-y-5">
          {/* Assign card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/50">
              <h3 className="font-bold text-gray-900 text-sm">Phân công nhân viên</h3>
            </div>
            <div className="p-5 space-y-4">
              {/* Current assignee */}
              {incident.assigneeName && (
                <div className="flex items-center gap-3 bg-blue-50 rounded-xl px-4 py-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {incident.assigneeName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs text-blue-500 font-semibold">Đang phụ trách</p>
                    <p className="text-sm font-bold text-blue-700">{incident.assigneeName}</p>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  {incident.assigneeName ? "Đổi nhân viên" : "Chọn nhân viên xử lý"}
                </label>
                <select
                  onChange={handleAssign}
                  disabled={actionLoading || !canAssign}
                  defaultValue=""
                  className="w-full bg-white border border-gray-200 text-gray-900 text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="" disabled>-- Chọn nhân viên --</option>
                  {staffList.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
                {!canAssign && (
                  <p className="text-xs text-gray-400 mt-1.5">Không thể phân công khi sự cố đã hoàn thành</p>
                )}
              </div>
            </div>
          </div>
          {/* Approve button - only when status is Open */}
          {incident.status === "Open" && (
            <div className="bg-white rounded-2xl border border-blue-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-blue-50 bg-blue-50/60">
                <h3 className="font-bold text-blue-900 text-sm flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Phê duyệt sự cố
                </h3>
              </div>
              <div className="p-5">
                <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                  Sự cố đang ở trạng thái <strong>Mới tạo</strong>. Admin cần phê duyệt để bắt đầu quy trình xử lý và phân công nhân viên.
                </p>
                <button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="w-full py-2.5 px-4 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
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
                  Phê duyệt sự cố
                </button>
              </div>
            </div>
          )}
          {/* Status actions */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/50">
              <h3 className="font-bold text-gray-900 text-sm">Cập nhật trạng thái</h3>
            </div>
            <div className="p-5 space-y-2">
              {(
                [
                  { status: "InProgress" as IncidentStatus, label: "Chuyển sang đang xử lý", cls: "text-orange-700 bg-orange-50 hover:bg-orange-100 border-orange-200" },
                  { status: "Resolved"   as IncidentStatus, label: "Đánh dấu hoàn thành",     cls: "text-green-700 bg-green-50 hover:bg-green-100 border-green-200" },
                  { status: "Closed"     as IncidentStatus, label: "Đóng sự cố",               cls: "text-slate-700 bg-slate-50 hover:bg-slate-100 border-slate-200" },
                ] as const
              ).map((action) => (
                <button
                  key={action.status}
                  onClick={() => handleUpdateStatus(action.status)}
                  disabled={actionLoading || incident.status === action.status}
                  className={`w-full py-2 px-4 text-sm font-semibold rounded-xl border transition disabled:opacity-40 disabled:cursor-not-allowed ${action.cls}`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
          {/* Emergency support */}
          <div className="bg-gray-900 rounded-2xl p-5 text-white">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="font-bold text-sm">Hỗ trợ khẩn cấp</h3>
            </div>
            <p className="text-xs text-gray-400 mb-3 leading-relaxed">
              Sự cố ảnh hưởng đến vận hành — liên hệ ngay phòng kỹ thuật trung tâm.
            </p>
            <div className="flex items-center justify-between bg-gray-800 rounded-xl px-4 py-2.5">
              <span className="font-bold text-blue-400 text-sm">1900-METRO-01</span>
              <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}