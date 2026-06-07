import { useEffect, useMemo, useState } from "react";
import { apiClient } from "@features/httpClient/ApiClient";
import { API_ENDPOINTS, ApiResponse } from "@features/httpClient/apiEndpoints";
import { unwrapApiResponse } from "@features/httpClient/unwrap";
import { deviceApi, type Device } from "@features/device/deviceApi";
import { incidentApi } from "@features/incident/incidentApi";
import type {
  BackendIncidentStatus,
  IncidentDetailRecord,
  IncidentPriority,
  IncidentRecord,
} from "@features/incident/incidentTypes";
import { staffGateApi } from "@features/staffGate/staffGateApi";
import type { GateResponse } from "@features/staffGate/staffGateTypes";

type Mode = "staff" | "admin";

type Station = {
  stationId: string;
  name: string;
};

const statusOptions: { value: BackendIncidentStatus; label: string }[] = [
  { value: "OPEN", label: "Chờ duyệt" },
  { value: "APPROVED", label: "Đã phê duyệt" },
  { value: "IN_PROGRESS", label: "Đang xử lý" },
  { value: "RESOLVED", label: "Đã khắc phục" },
  { value: "CLOSED", label: "Đã đóng" },
];

const priorityOptions: { value: IncidentPriority; label: string }[] = [
  { value: "LOW", label: "Thấp" },
  { value: "MEDIUM", label: "Trung bình" },
  { value: "HIGH", label: "Cao" },
  { value: "CRITICAL", label: "Khẩn cấp" },
];

const statusLabel = (status: BackendIncidentStatus) =>
  statusOptions.find((item) => item.value === status)?.label ?? status;

const priorityLabel = (priority: IncidentPriority) =>
  priorityOptions.find((item) => item.value === priority)?.label ?? priority;

const getBackendStatus = (incident: IncidentRecord): BackendIncidentStatus =>
  incident.backendStatus ?? "OPEN";

const getPriority = (incident: IncidentRecord): IncidentPriority =>
  incident.priority ?? "LOW";

const statusClass = (status: BackendIncidentStatus) => {
  if (status === "OPEN") return "bg-blue-50 text-blue-700 border-blue-200";
  if (status === "APPROVED" || status === "ASSIGNED") return "bg-indigo-50 text-indigo-700 border-indigo-200";
  if (status === "IN_PROGRESS") return "bg-amber-50 text-amber-700 border-amber-200";
  if (status === "RESOLVED") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
};

const priorityClass = (priority: IncidentPriority) => {
  if (priority === "CRITICAL") return "bg-red-50 text-red-700 border-red-200";
  if (priority === "HIGH") return "bg-orange-50 text-orange-700 border-orange-200";
  if (priority === "MEDIUM") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
};

const formatDateTime = (value?: string) => {
  if (!value) return "--";
  const normalized = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value) ? value : `${value}Z`;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
};

function getStationName(incident: IncidentRecord, stations: Station[]) {
  return incident.stationName || stations.find((station) => station.stationId === incident.stationId)?.name || incident.stationId || "--";
}

function getTargetLabel(incident: IncidentRecord) {
  if (incident.deviceCode || incident.deviceId) return incident.deviceCode || incident.deviceId;
  if (incident.gateCode || incident.gateId) return incident.gateCode || incident.gateId;
  return "Toàn ga";
}

export default function IncidentManagement({ mode }: { mode: Mode }) {
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [gates, setGates] = useState<GateResponse[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selected, setSelected] = useState<IncidentDetailRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [metaLoading, setMetaLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<BackendIncidentStatus | "">("");
  const [priorityFilter, setPriorityFilter] = useState<IncidentPriority | "">("");
  const [stationFilter, setStationFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    stationId: "",
    gateId: "",
    deviceId: "",
    priority: "MEDIUM" as IncidentPriority,
  });

  const canCreate = mode === "staff";
  const canComment = mode === "staff";

  const loadMeta = async () => {
    setMetaLoading(true);
    try {
      const [stationRes, gateItems, deviceItems] = await Promise.all([
        apiClient.get<ApiResponse<Station[]> | Station[]>(API_ENDPOINTS.stations.base),
        staffGateApi.getGates().catch(() => []),
        deviceApi.getDevices().catch(() => []),
      ]);
      const stationData = unwrapApiResponse<Station[]>(stationRes.data);
      setStations(Array.isArray(stationData) ? stationData : []);
      setGates(gateItems);
      setDevices(deviceItems);
    } finally {
      setMetaLoading(false);
    }
  };

  const loadIncidents = async () => {
    setLoading(true);
    try {
      const data = await incidentApi.getIncidents({
        stationId: stationFilter,
        priority: priorityFilter,
        status: statusFilter,
      });
      setIncidents(data);
      setError("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể tải danh sách sự cố.";
      setError(message);
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (incident: IncidentRecord) => {
    setActionError("");
    setActionMessage("");
    try {
      const detail = await incidentApi.getIncidentById(incident.id);
      setSelected(detail);
    } catch {
      setSelected({ ...incident, timeline: [], comments: incident.comments ?? [] });
      if (mode === "admin") {
        setActionError("Admin có thể chưa được BE cho quyền xem chi tiết /staff/incidents/{id}.");
      }
    }
  };

  useEffect(() => {
    void loadMeta();
  }, []);

  useEffect(() => {
    void loadIncidents();
  }, [statusFilter, priorityFilter, stationFilter]);

  const stationGates = useMemo(
    () => gates.filter((gate) => gate.stationId === form.stationId),
    [form.stationId, gates],
  );

  const stationDevices = useMemo(
    () => devices.filter((device) => !form.stationId || device.stationId === form.stationId),
    [devices, form.stationId],
  );

  const filteredIncidents = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return incidents;
    return incidents.filter((incident) =>
      [
        incident.id,
        incident.title,
        incident.description,
        incident.assigneeName,
        incident.reporterName,
        incident.stationName,
        incident.gateCode,
        incident.deviceCode,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [incidents, query]);

  const stats = useMemo(
    () => ({
      total: incidents.length,
      open: incidents.filter((item) => getBackendStatus(item) === "OPEN").length,
      active: incidents.filter((item) => ["APPROVED", "IN_PROGRESS"].includes(getBackendStatus(item))).length,
      critical: incidents.filter((item) => getPriority(item) === "CRITICAL").length,
      done: incidents.filter((item) => ["RESOLVED", "CLOSED"].includes(getBackendStatus(item))).length,
    }),
    [incidents],
  );

  const refreshSelected = async (id: string) => {
    const detail = await incidentApi.getIncidentById(id);
    setSelected(detail);
    setIncidents((current) => current.map((item) => (item.id === detail.id ? detail : item)));
  };

  const submitCreate = async () => {
    setActionError("");
    if (!form.title.trim() || !form.stationId) {
      setActionError("Vui lòng nhập tiêu đề và chọn ga.");
      return;
    }
    try {
      const created = await incidentApi.createIncident({
        title: form.title.trim(),
        description: form.description.trim(),
        stationId: form.stationId,
        gateId: form.gateId || undefined,
        deviceId: form.deviceId || undefined,
        severity: form.priority.toLowerCase() as never,
        priority: form.priority,
      });
      setIncidents((current) => [created, ...current]);
      setCreateOpen(false);
      setForm({ title: "", description: "", stationId: "", gateId: "", deviceId: "", priority: "MEDIUM" });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Không thể tạo sự cố.");
    }
  };

  const runIncidentAction = async (
    action: "approve" | "start" | "resolve" | "close" | "reopen",
  ) => {
    if (!selected) return;
    setActionError("");
    setActionMessage("");
    try {
      const updated =
        action === "approve"
          ? await incidentApi.approveIncident(selected.id)
          : action === "start"
            ? await incidentApi.startIncident(selected.id)
            : action === "resolve"
              ? await incidentApi.resolveIncident(selected.id)
              : action === "close"
                ? await incidentApi.closeIncident(selected.id)
                : await incidentApi.reopenIncident(selected.id);

      setSelected((current) => current ? { ...current, ...updated } : current);
      setIncidents((current) => current.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)));
      setActionMessage(
        action === "approve"
          ? "Đã phê duyệt sự cố."
          : action === "start"
            ? "Đã bắt đầu xử lý sự cố."
            : action === "resolve"
              ? "Đã báo cáo hoàn thành sự cố."
              : action === "close"
                ? "Đã đóng sự cố."
                : "Đã yêu cầu sửa lại sự cố.",
      );

      try {
        await refreshSelected(selected.id);
      } catch {
        // The action already succeeded; keep the optimistic state from the action response.
      }
      await loadIncidents();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Không thể cập nhật sự cố.");
    }
  };

  const addComment = async () => {
    if (!selected || !comment.trim()) return;
    setActionError("");
    setActionMessage("");
    try {
      await incidentApi.addTimelineComment(selected.id, comment.trim());
      setComment("");
      await refreshSelected(selected.id);
      setActionMessage("Đã gửi bình luận.");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Không thể thêm bình luận.");
    }
  };

  return (
    <div className="w-full max-w-[1400px] space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            {mode === "admin" ? "Admin" : "Nhân viên ga"}
          </p>
          <h1 className="mt-1 text-2xl font-black text-slate-900">
            {mode === "admin" ? "Giám sát sự cố" : "Xử lý sự cố"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {mode === "admin"
              ? "Theo dõi tình trạng và bàn giao sự cố cho nhân viên xử lý."
              : "Tạo sự cố, cập nhật trạng thái và ghi nhận tiến trình xử lý."}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void loadIncidents()}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700"
          >
            Làm mới
          </button>
          {canCreate ? (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white"
            >
              Tạo sự cố
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ["Tổng sự cố", stats.total, "text-slate-900"],
          ["Mới", stats.open, "text-blue-600"],
          ["Đang xử lý", stats.active, "text-amber-600"],
          ["Khẩn cấp", stats.critical, "text-red-600"],
          ["Hoàn thành", stats.done, "text-emerald-600"],
        ].map(([label, value, color]) => (
          <div key={label} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
            <p className={`mt-2 text-3xl font-black ${color}`}>{loading ? "--" : value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_180px_180px_220px]">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm theo tiêu đề, ga, cổng, thiết bị..."
            className="rounded-xl bg-slate-50 px-4 py-2.5 text-sm outline outline-1 outline-slate-200"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as BackendIncidentStatus | "")}
            className="rounded-xl bg-slate-50 px-4 py-2.5 text-sm outline outline-1 outline-slate-200"
          >
            <option value="">Tất cả trạng thái</option>
            {statusOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
          <select
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value as IncidentPriority | "")}
            className="rounded-xl bg-slate-50 px-4 py-2.5 text-sm outline outline-1 outline-slate-200"
          >
            <option value="">Tất cả mức độ</option>
            {priorityOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
          <select
            value={stationFilter}
            disabled={metaLoading}
            onChange={(event) => setStationFilter(event.target.value)}
            className="rounded-xl bg-slate-50 px-4 py-2.5 text-sm outline outline-1 outline-slate-200"
          >
            <option value="">Tất cả ga</option>
            {stations.map((station) => <option key={station.stationId} value={station.stationId}>{station.name}</option>)}
          </select>
        </div>
      </div>

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div> : null}
      {actionError ? <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">{actionError}</div> : null}
      {actionMessage ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{actionMessage}</div> : null}

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[1160px] w-full table-fixed text-left text-sm">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="w-[300px] px-5 py-3">Sự cố</th>
                <th className="w-[170px] px-5 py-3">Ga</th>
                <th className="w-[150px] px-5 py-3">Đối tượng</th>
                <th className="w-[120px] px-5 py-3">Mức độ</th>
                <th className="w-[150px] px-5 py-3">Trạng thái</th>
                <th className="w-[180px] px-5 py-3">Bàn giao</th>
                <th className="w-[190px] px-5 py-3">Cập nhật</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-500">Đang tải sự cố...</td></tr>
              ) : filteredIncidents.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-500">Không có sự cố phù hợp.</td></tr>
              ) : filteredIncidents.map((incident) => (
                <tr key={incident.id} className="border-t border-slate-100 hover:bg-slate-50/70">
                  <td className="px-5 py-4">
                    <button type="button" onClick={() => void openDetail(incident)} className="text-left">
                      <p className="font-bold text-slate-900">{incident.title}</p>
                      <p className="mt-1 line-clamp-1 text-xs text-slate-500">{incident.description || incident.id}</p>
                    </button>
                  </td>
                  <td className="px-5 py-4 font-medium text-slate-700"><span className="block truncate">{getStationName(incident, stations)}</span></td>
                  <td className="px-5 py-4 text-slate-600"><span className="block truncate">{getTargetLabel(incident)}</span></td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex min-w-[86px] items-center justify-center whitespace-nowrap rounded-full border px-3 py-1 text-xs font-bold ${priorityClass(getPriority(incident))}`}>
                      {priorityLabel(getPriority(incident))}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex min-w-[118px] items-center justify-center whitespace-nowrap rounded-full border px-3 py-1 text-xs font-bold ${statusClass(getBackendStatus(incident))}`}>
                      {statusLabel(getBackendStatus(incident))}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex max-w-full items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
                      <span className="truncate">{incident.assigneeName || "Chưa bàn giao"}</span>
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-500">{formatDateTime(incident.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {createOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-bold text-slate-900">Tạo sự cố mới</h2>
              <p className="mt-1 text-sm text-slate-500">Backend sẽ tự bàn giao, đổi trạng thái thiết bị/ga theo mức độ.</p>
            </div>
            <div className="grid gap-4 px-6 py-5">
              <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Tiêu đề sự cố" className="rounded-xl bg-slate-50 px-4 py-3 text-sm outline outline-1 outline-slate-200" />
              <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Mô tả chi tiết" rows={4} className="rounded-xl bg-slate-50 px-4 py-3 text-sm outline outline-1 outline-slate-200" />
              <div className="grid gap-3 md:grid-cols-2">
                <select value={form.stationId} onChange={(event) => setForm((current) => ({ ...current, stationId: event.target.value, gateId: "", deviceId: "" }))} className="rounded-xl bg-slate-50 px-4 py-3 text-sm outline outline-1 outline-slate-200">
                  <option value="">Chọn ga *</option>
                  {stations.map((station) => <option key={station.stationId} value={station.stationId}>{station.name}</option>)}
                </select>
                <select value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value as IncidentPriority }))} className="rounded-xl bg-slate-50 px-4 py-3 text-sm outline outline-1 outline-slate-200">
                  {priorityOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
                <select value={form.gateId} onChange={(event) => setForm((current) => ({ ...current, gateId: event.target.value }))} className="rounded-xl bg-slate-50 px-4 py-3 text-sm outline outline-1 outline-slate-200">
                  <option value="">Không chọn cổng</option>
                  {stationGates.map((gate) => <option key={gate.gateId} value={gate.gateId}>{gate.gateCode}{gate.name ? ` - ${gate.name}` : ""}</option>)}
                </select>
                <select value={form.deviceId} onChange={(event) => setForm((current) => ({ ...current, deviceId: event.target.value }))} className="rounded-xl bg-slate-50 px-4 py-3 text-sm outline outline-1 outline-slate-200">
                  <option value="">Không chọn thiết bị</option>
                  {stationDevices.map((device) => <option key={device.id} value={device.id}>{device.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
              <button type="button" onClick={() => setCreateOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700">Hủy</button>
              <button type="button" onClick={submitCreate} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white">Tạo sự cố</button>
            </div>
          </div>
        </div>
      ) : null}

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" role="dialog" aria-modal="true">
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{selected.id}</p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">{selected.title}</h2>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600">Đóng</button>
            </div>
            {actionError ? <div className="mx-6 mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">{actionError}</div> : null}
            {actionMessage ? <div className="mx-6 mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{actionMessage}</div> : null}
            <div className="grid gap-6 overflow-y-auto p-6 lg:grid-cols-[1fr_300px]">
              <div className="space-y-5">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Mô tả</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{selected.description || "Không có mô tả."}</p>
                </div>
                <div>
                  <h3 className="mb-3 text-sm font-bold text-slate-900">Timeline xử lý</h3>
                  <div className="space-y-3">
                    {(selected.comments ?? []).length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">Chưa có bình luận.</div>
                    ) : selected.comments?.map((item) => {
                      const system = item.content.startsWith("[Hệ thống]");
                      return (
                        <div key={item.id} className={`rounded-xl border px-4 py-3 ${system ? "border-blue-100 bg-blue-50/70" : "border-slate-100 bg-white"}`}>
                          <div className="flex items-center justify-between gap-3 text-xs">
                            <span className="font-bold text-slate-700">{system ? "Hệ thống" : item.userName || "Nhân viên"}</span>
                            <span className="text-slate-400">{formatDateTime(item.createdAt)}</span>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-slate-700">{item.content}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {canComment ? (
                  <div className="rounded-2xl border border-slate-100 p-4">
                    <textarea value={comment} onChange={(event) => setComment(event.target.value)} rows={3} placeholder="Thêm ghi chú xử lý..." className="w-full rounded-xl bg-slate-50 px-4 py-3 text-sm outline outline-1 outline-slate-200" />
                    <button type="button" onClick={addComment} className="mt-3 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white">Gửi bình luận</button>
                  </div>
                ) : null}
              </div>
              <aside className="space-y-4">
                <div className="rounded-2xl border border-slate-100 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Thông tin</p>
                  <dl className="mt-3 space-y-2 text-sm">
                    <div><dt className="text-slate-400">Ga</dt><dd className="font-semibold text-slate-800">{getStationName(selected, stations)}</dd></div>
                    <div><dt className="text-slate-400">Cổng/thiết bị</dt><dd className="font-semibold text-slate-800">{getTargetLabel(selected)}</dd></div>
                    <div><dt className="text-slate-400">Người báo</dt><dd className="font-semibold text-slate-800">{selected.reporterName || "--"}</dd></div>
                    <div><dt className="text-slate-400">Bàn giao</dt><dd className="font-semibold text-slate-800">{selected.assigneeName || "Chưa bàn giao"}</dd></div>
                    <div><dt className="text-slate-400">Tạo lúc</dt><dd className="font-semibold text-slate-800">{formatDateTime(selected.createdAt)}</dd></div>
                  </dl>
                </div>
                <div className="rounded-2xl border border-slate-100 p-4">
                  <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Hành động</p>
                  <div className="grid gap-2">
                    {mode === "admin" && getBackendStatus(selected) === "OPEN" ? (
                      <button type="button" onClick={() => void runIncidentAction("approve")} className="rounded-xl bg-indigo-600 px-3 py-2 text-left text-sm font-bold text-white">
                        Phê duyệt sự cố
                      </button>
                    ) : null}
                    {mode === "staff" && getBackendStatus(selected) === "APPROVED" ? (
                      <button type="button" onClick={() => void runIncidentAction("start")} className="rounded-xl bg-amber-500 px-3 py-2 text-left text-sm font-bold text-white">
                        Bắt đầu sửa chữa
                      </button>
                    ) : null}
                    {mode === "staff" && getBackendStatus(selected) === "IN_PROGRESS" ? (
                      <button type="button" onClick={() => void runIncidentAction("resolve")} className="rounded-xl bg-emerald-600 px-3 py-2 text-left text-sm font-bold text-white">
                        Báo cáo hoàn thành
                      </button>
                    ) : null}
                    {mode === "admin" && getBackendStatus(selected) === "RESOLVED" ? (
                      <>
                        <button type="button" onClick={() => void runIncidentAction("close")} className="rounded-xl bg-emerald-600 px-3 py-2 text-left text-sm font-bold text-white">
                          Nghiệm thu đạt - Đóng sự cố
                        </button>
                        <button type="button" onClick={() => void runIncidentAction("reopen")} className="rounded-xl bg-red-600 px-3 py-2 text-left text-sm font-bold text-white">
                          Nghiệm thu lỗi - Yêu cầu sửa lại
                        </button>
                      </>
                    ) : null}
                    {(
                      (mode === "admin" && !["OPEN", "RESOLVED"].includes(getBackendStatus(selected))) ||
                      (mode === "staff" && !["APPROVED", "IN_PROGRESS"].includes(getBackendStatus(selected)))
                    ) ? (
                      <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-500">
                        Chưa có hành động phù hợp ở trạng thái này.
                      </p>
                    ) : null}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
