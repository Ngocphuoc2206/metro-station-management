/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import StaffLayout from "@components/organisms/StaffDashboard/StaffLayout";
import { incidentApi } from "@features/incident/incidentApi";
import type {
  IncidentDetailRecord,
  IncidentStatus,
} from "@features/incident/incidentTypes";
import TimelineSection from "@components/organisms/IncidentDetail/TimelineSection";
import QuickActions from "@components/organisms/IncidentDetail/QuickActions";
import { toast } from "react-hot-toast";

const MOCK_USERS = [
  "Nguyễn Văn An",
  "Lê Văn Tuấn",
  "Trần Minh",
  "Nguyễn Thu Hà",
];

export default function IncidentDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [incident, setIncident] = useState<IncidentDetailRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [comment, setComment] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (id && typeof id === "string") {
      fetchIncident(id);
    }
  }, [id]);

  const fetchIncident = async (incidentId: string) => {
    try {
      setLoading(true);
      const data = await incidentApi.getIncidentById(incidentId);
      setIncident(data);
    } catch (error: any) {
      toast.error(error.message || "Lỗi tải dữ liệu sự cố");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: IncidentStatus) => {
    if (!incident) return;
    try {
      setActionLoading(true);
      await incidentApi.updateIncidentStatus(incident.id, newStatus);
      toast.success(`Đã cập nhật trạng thái thành ${newStatus}`);
      await fetchIncident(incident.id);
    } catch (error: any) {
      toast.error(error.message || "Lỗi chuyển đổi trạng thái!");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssign = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!incident) return;
    const assigneeName = e.target.value;
    if (!assigneeName) return;

    try {
      setActionLoading(true);
      await incidentApi.assignIncident(incident.id, assigneeName);
      toast.success(`Đã phân công cho ${assigneeName}`);
      await fetchIncident(incident.id);
    } catch (error: any) {
      toast.error(error.message || "Lỗi phân công!");
      // Reset select if failed
      e.target.value = incident.assigneeName || "";
    } finally {
      setActionLoading(false);
    }
  };

  const handlePostComment = async () => {
    if (!incident || (!comment.trim() && attachments.length === 0)) return;
    try {
      setActionLoading(true);
      await incidentApi.addTimelineComment(incident.id, comment.trim());
      toast.success("Đã gửi phản hồi");
      setComment("");
      setAttachments([]);
      await fetchIncident(incident.id);
    } catch (error: any) {
      toast.error("Lỗi gửi phản hồi");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <StaffLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </StaffLayout>
    );
  }

  if (!incident) {
    return (
      <StaffLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-bold text-gray-900">
            Không tìm thấy sự cố
          </h2>
          <button
            onClick={() => router.push("/staff/incidents")}
            className="mt-4 text-blue-600 hover:underline"
          >
            Quay lại danh sách
          </button>
        </div>
      </StaffLayout>
    );
  }

  const statusColors = {
    Open: "bg-gray-100 text-gray-700",
    Assigned: "bg-blue-100 text-blue-700",
    InProgress: "bg-orange-100 text-orange-700",
    Escalated: "bg-red-100 text-red-700",
    Resolved: "bg-green-100 text-green-700",
    Closed: "bg-gray-800 text-white",
  };

  const severityColors = {
    low: "bg-blue-50 text-blue-700 border-blue-200",
    medium: "bg-yellow-50 text-yellow-700 border-yellow-200",
    high: "bg-orange-50 text-orange-700 border-orange-200",
    critical: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <StaffLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Breadcrumb & Header */}
        <div>
          <div className="flex items-center text-sm text-gray-500 mb-2">
            <Link
              href="/staff/incidents"
              className="hover:text-blue-600 transition-colors"
            >
              Nhân viên ga
            </Link>
            <span className="mx-2">›</span>
            <Link
              href="/staff/incidents"
              className="hover:text-blue-600 transition-colors"
            >
              Sự cố
            </Link>
            <span className="mx-2">›</span>
            <span className="font-medium text-gray-900">{incident.id}</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-900">
              {incident.title}
            </h1>
            <div className="flex items-center gap-3">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium border ${severityColors[incident.severity]}`}
              >
                {incident.severity.toUpperCase()}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[incident.status]}`}
              >
                • {incident.status}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cột Trái (70%) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Thông tin chung */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4">Thông tin chung</h3>
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Thiết bị
                  </span>
                  <div className="flex items-center gap-2 text-gray-900 font-medium">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm11 1H6v8l4-2 4 2V6z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {incident.deviceId}
                  </div>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Vị trí Nhà Ga
                  </span>
                  <div className="flex items-center gap-2 text-gray-900 font-medium">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {incident.stationId}
                  </div>
                </div>
              </div>
              <div>
                <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Mô tả chi tiết
                </span>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {incident.description || "Không có mô tả chi tiết."}
                </p>
              </div>
            </div>

            {/* Timeline */}
            <TimelineSection events={incident.timeline} />

            {/* Comment Box */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3 relative">
              {/* File input (Hidden) */}
              <input
                type="file"
                multiple
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx"
              />

              {/* Attachments Preview */}
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {attachments.map((file, idx) => (
                    <div
                      key={idx}
                      className="relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center gap-2 pr-2"
                    >
                      {file.type.startsWith("image/") ? (
                        <div className="h-10 w-10 bg-gray-200">
                          {/* We can use URL.createObjectURL for preview, but ensuring cleanup is tedious here. We'll just show an icon for now or a tiny preview */}
                          <img
                            src={URL.createObjectURL(file)}
                            alt="preview"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-10 w-10 bg-blue-50 flex items-center justify-center text-blue-500">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                      <span className="text-xs text-gray-600 truncate max-w-25 font-medium">
                        {file.name}
                      </span>
                      <button
                        onClick={() => removeAttachment(idx)}
                        className="p-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200 opacity-0 group-hover:opacity-100 transition-opacity absolute right-1 top-1/2 -translate-y-1/2"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3 w-3"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Viết phản hồi hoặc ghi chú thêm..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px] resize-none"
              ></textarea>
              <div className="flex justify-between items-center mt-1">
                <div className="flex gap-2 text-gray-400">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 hover:bg-gray-100 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                    title="Đính kèm tệp"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 hover:bg-gray-100 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                    title="Thêm hình ảnh"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
                <button
                  onClick={handlePostComment}
                  disabled={
                    actionLoading ||
                    (!comment.trim() && attachments.length === 0)
                  }
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
                >
                  Gửi đi
                </button>
              </div>
            </div>
          </div>

          {/* Cột Phải (30%) */}
          <div className="space-y-6">
            {/* Phân công & SLA */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-bold text-gray-900">Phân công & SLA</h3>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Người phụ trách
                  </label>
                  <select
                    value={incident.assigneeName || ""}
                    onChange={handleAssign}
                    disabled={
                      actionLoading ||
                      (incident.status !== "Open" &&
                        incident.status !== "Assigned" &&
                        incident.status !== "InProgress")
                    }
                    className="w-full bg-white border border-gray-200 text-gray-900 text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="" disabled>
                      Chưa phân công
                    </option>
                    {MOCK_USERS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-red-50 rounded-xl p-4 border border-red-100 text-center">
                  <div className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                        clipRule="evenodd"
                      />
                    </svg>
                    SLA - THỜI GIAN XỬ LÝ
                  </div>
                  <div className="text-2xl font-black text-red-600">
                    {incident.slaMinutes}p{" "}
                    <span className="text-sm font-normal">còn lại</span>
                  </div>
                  <div className="mt-2 w-full bg-red-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-red-600 h-full w-2/3"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Hành động nhanh */}
            <QuickActions
              status={incident.status}
              onUpdateStatus={handleUpdateStatus}
              isLoading={actionLoading}
            />

            {/* Hỗ trợ nhanh */}
            <div className="bg-gray-900 rounded-2xl p-6 text-white shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-blue-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <h3 className="font-bold">Hỗ trợ nhanh</h3>
              </div>
              <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                Nếu sự cố liên quan đến hạ tầng mạng nhà ga, vui lòng liên hệ
                trực tiếp phòng kỹ thuật trung tâm.
              </p>
              <div className="flex items-center justify-between bg-gray-800 rounded-xl px-4 py-3">
                <span className="font-bold text-blue-400">1900-METRO-01</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StaffLayout>
  );
}
