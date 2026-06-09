/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useMemo } from "react";
import IncidentTableView from "./IncidentTableView";
import CreateIncidentModal from "./CreateIncidentModal";
import IncidentDetailModal from "./IncidentDetailModal";
import { incidentApi } from "@features/incident/incidentApi";
import toast from "react-hot-toast";
import type {
  IncidentFilterParams,
  IncidentRecord,
} from "@features/incident/incidentTypes";

export default function IncidentDashboard() {
  const [filters] = useState<IncidentFilterParams>({
    stationId: "all",
    deviceType: "all",
    severity: "all" as any,
  });

  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<IncidentRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Lưu ảnh bằng chứng xử lý theo incidentId (base64) — persist qua F5 nhờ localStorage
  const [evidenceStore, setEvidenceStore] = useState<Record<string, string[]>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const raw = localStorage.getItem("incident_evidence_v1");
      return raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    loadIncidents();
  }, [filters]);

  // Sync evidenceStore → localStorage mỗi khi có thay đổi
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem("incident_evidence_v1", JSON.stringify(evidenceStore));
    } catch {
      // localStorage đầy (ảnh base64 nặng) — bỏ qua, không crash
      console.warn("[IncidentDashboard] localStorage full, evidence images not persisted");
    }
  }, [evidenceStore]);

  async function loadIncidents() {
    setLoading(true);
    try {
      const data = await incidentApi.getIncidents(filters);
      setIncidents(data);
    } catch (error) {
      console.error("Failed to load incidents", error);
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (incident: IncidentRecord) => {
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

  const filteredIncidents = useMemo(() => {
    if (!searchQuery.trim()) return incidents;
    const q = searchQuery.toLowerCase();
    return incidents.filter(
      (i) =>
        i.id.toLowerCase().includes(q) ||
        i.title.toLowerCase().includes(q) ||
        (i.assigneeName ?? "").toLowerCase().includes(q),
    );
  }, [incidents, searchQuery]);

  // Stats computed from incidents
  const stats = useMemo(() => {
    const total = incidents.length;
    const highPriority = incidents.filter(
      (i) => i.severity === "high" || i.severity === "critical",
    ).length;
    const inProgress = incidents.filter(
      (i) => i.status === "InProgress" || i.status === "Escalated" || i.status === "Assigned",
    ).length;
    const resolved = incidents.filter(
      (i) => i.status === "Resolved" || i.status === "Closed",
    ).length;
    return { total, highPriority, inProgress, resolved };
  }, [incidents]);

  return (
    <div className="flex flex-col space-y-6 w-full">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-gray-500 font-medium">
        <span>Nhân viên ga</span>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-blue-600 font-semibold">Quản lý sự cố</span>
      </div>

      {/* Page Header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Quản lý sự cố</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Tạo sự cố mới
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tổng số lỗi</div>
            <div className="text-2xl font-black text-gray-900">{loading ? "—" : stats.total}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Ưu tiên cao</div>
            <div className="text-2xl font-black text-gray-900">{loading ? "—" : stats.highPriority}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Đang xử lý</div>
            <div className="text-2xl font-black text-gray-900">{loading ? "—" : stats.inProgress}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Hoàn thành</div>
            <div className="text-2xl font-black text-gray-900">{loading ? "—" : stats.resolved}</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <IncidentTableView
        incidents={filteredIncidents}
        loading={loading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onViewDetail={setSelectedIncident}
        onDelete={handleDelete}
      />

      {/* Emergency Support Banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <div className="font-bold text-blue-900 text-sm mb-0.5">Cần hỗ trợ kỹ thuật khẩn cấp?</div>
          <div className="text-blue-700 text-sm">
            Nếu sự cố ảnh hưởng trực tiếp đến an toàn vận hành, vui lòng liên hệ trực tiếp với bộ phận kỹ thuật qua kênh liên lạc ưu tiên cấp 1.
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateIncidentModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={(formData) => {
          // Optimistic: reload list (BE may return wrong severity, but we refresh promptly)
          loadIncidents();
          // If the list still shows wrong severity after refresh, patch it
          setIncidents((prev) =>
            prev.map((inc) =>
              inc.severity !== formData.severity && inc.title === formData.title
                ? { ...inc, severity: formData.severity as any }
                : inc,
            ),
          );
        }}
      />

      {selectedIncident && (
        <IncidentDetailModal
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
          onStatusUpdated={loadIncidents}
          evidenceImages={evidenceStore[selectedIncident.id] ?? []}
          onEvidenceSaved={(id, dataUrls) =>
            setEvidenceStore((prev) => ({ ...prev, [id]: dataUrls }))
          }
        />
      )}
    </div>
  );
}
