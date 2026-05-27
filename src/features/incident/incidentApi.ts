/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from "@features/httpClient/ApiClient";
import { API_ENDPOINTS, ApiResponse, withPathParam } from "@features/httpClient/apiEndpoints";
import type {
  IncidentRecord,
  IncidentStatus,
  IncidentSeverity,
  IncidentFilterParams,
  IncidentFormData,
  IncidentDetailRecord,
  IncidentTimelineEvent,
} from "./incidentTypes";

// ── Backend response shapes (khớp với response thực tế từ BE) ────────────────
interface BackendIncident {
  incidentId?: string;
  id?: string;
  title?: string;
  description?: string;
  stationId?: string;
  stationName?: string;   // BE trả về tên ga trực tiếp
  gateId?: string;
  gateCode?: string;      // Mã hiển thị của cổng (VD: GATE-BT-01)
  deviceId?: string;
  deviceCode?: string;    // Mã hiển thị của thiết bị
  deviceType?: string;
  priority?: string;      // LOW/MEDIUM/HIGH/CRITICAL
  severity?: string;
  status?: string;        // OPEN/ASSIGNED/IN_PROGRESS/RESOLVED/CLOSED
  assigneeName?: string;
  reporterName?: string;
  assignedTo?: string;
  createdAt?: string;
  updatedAt?: string;
  updatedDate?: string;
  comments?: BackendComment[];
  [key: string]: unknown;
}

interface BackendComment {
  commentId?: string;
  id?: string;
  userId?: string;
  userName?: string;      // BE thực tế trả về userName
  authorName?: string;
  actorName?: string;
  content?: string;
  text?: string;
  createdAt?: string;
  timestamp?: string;
  type?: string;
  [key: string]: unknown;
}

// ── Normalizers ───────────────────────────────────────────────────────────────
function normalizeSeverity(raw?: string): IncidentSeverity {
  const v = (raw ?? "").toUpperCase();
  if (v === "CRITICAL") return "critical";
  if (v === "HIGH") return "high";
  if (v === "MEDIUM") return "medium";
  return "low";
}

function normalizeStatus(raw?: string): IncidentStatus {
  const v = (raw ?? "").toUpperCase().replace(/[_\s-]/g, "");
  if (v === "OPEN") return "Open";
  if (v === "ASSIGNED") return "Assigned";
  if (v.includes("PROGRESS") || v === "INPROGRESS") return "InProgress";
  if (v === "ESCALATED") return "Escalated";
  if (v === "RESOLVED") return "Resolved";
  if (v === "CLOSED") return "Closed";
  return "Open";
}

function mapToUI(b: BackendIncident): IncidentRecord {
  return {
    id: b.incidentId ?? b.id ?? "",
    title: b.title ?? "(Không có tiêu đề)",
    stationId: b.stationName ?? b.stationId ?? "", // Dùng tên ga thay vì UUID để hiển thị
    // Ưu tiên gateCode/deviceCode để hiển thị mã đọc được (VD: GATE-BT-01)
    deviceId: b.gateCode ?? b.deviceCode ?? b.deviceId ?? b.gateId ?? "",
    deviceType: b.deviceType ?? "gate",
    severity: normalizeSeverity(b.priority ?? b.severity),
    status: normalizeStatus(b.status),
    assigneeName: b.assigneeName ?? b.reporterName ?? b.assignedTo,
    description: b.description,
    createdAt: b.createdAt ?? "",
    updatedAt: b.updatedAt ?? b.updatedDate ?? b.createdAt ?? "",
  };
}

function mapCommentToTimeline(b: BackendComment, idx: number): IncidentTimelineEvent {
  return {
    id: b.commentId ?? b.id ?? `tl-${idx}`,
    type: (b.type as any) ?? "comment",
    actorName: b.userName ?? b.authorName ?? b.actorName ?? "Nhân viên", // BE trả về userName
    timestamp: b.createdAt ?? b.timestamp ?? "",
    content: b.content ?? b.text ?? "",
  };
}

export const incidentApi = {
  // ── GET /staff/incidents (FE-31, hỗ trợ filter) ───────────────────────────
  getIncidents: async (filters?: IncidentFilterParams): Promise<IncidentRecord[]> => {
    const params = new URLSearchParams();
    if (filters?.stationId && filters.stationId !== "all")
      params.append("stationId", filters.stationId);
    if (filters?.severity && filters.severity !== ("all" as any))
      params.append("priority", filters.severity.toUpperCase());

    const url = params.toString()
      ? `${API_ENDPOINTS.incidents.staff}?${params.toString()}`
      : API_ENDPOINTS.incidents.staff;

    const res = await apiClient.get<ApiResponse<BackendIncident[]>>(url);
    const raw = res.data.results;
    if (!Array.isArray(raw)) return [];
    return raw.map(mapToUI);
  },

  // ── GET /staff/incidents?status=OPEN (kanban filter) ──────────────────────
  getIncidentsByStatus: async (status: string): Promise<IncidentRecord[]> => {
    const res = await apiClient.get<ApiResponse<BackendIncident[]>>(
      `${API_ENDPOINTS.incidents.staff}?status=${status.toUpperCase()}`
    );
    const raw = res.data.results;
    if (!Array.isArray(raw)) return [];
    return raw.map(mapToUI);
  },

  // ── GET /staff/incidents/{id} ─────────────────────────────────────────────
  getIncidentById: async (id: string): Promise<IncidentDetailRecord> => {
    const res = await apiClient.get<ApiResponse<BackendIncident>>(
      withPathParam(API_ENDPOINTS.incidents.staff, id)
    );
    const b = res.data.results;
    const comments = (b.comments as BackendComment[] | undefined) ?? [];
    return {
      ...mapToUI(b),
      timeline: comments.map(mapCommentToTimeline),
      slaMinutes: (b.slaMinutes as number | undefined),
    };
  },

  // ── POST /staff/incidents (FE-32) ─────────────────────────────────────────
  createIncident: async (data: IncidentFormData): Promise<IncidentRecord> => {
    const res = await apiClient.post<ApiResponse<BackendIncident>>(
      API_ENDPOINTS.incidents.staff,
      {
        title: data.title,
        description: data.description ?? "",
        stationId: (data as any).stationId ?? null,
        gateId: (data as any).gateId ?? null,
        deviceId: data.deviceId || null,
        priority: data.severity.toUpperCase(), // LOW/MEDIUM/HIGH/CRITICAL
      }
    );
    return mapToUI(res.data.results);
  },

  // ── POST /staff/incidents/{id}/comments (FE-33) — raw text, not JSON ─────
  addTimelineComment: async (id: string, content: string): Promise<any> => {
    const res = await apiClient.post<ApiResponse<BackendComment>>(
      `${withPathParam(API_ENDPOINTS.incidents.staff, id)}/comments`,
      content,           // raw string body
      { headers: { "Content-Type": "text/plain" } }
    );
    return res.data.results ?? { id: Date.now(), content, type: "comment" };
  },

  // ── PATCH /staff/incidents/{id}/status?status={status} (FE-33) ───────────
  updateIncidentStatus: async (
    id: string,
    newStatus: IncidentStatus,
  ): Promise<IncidentRecord | null> => {
    const beStatus = newStatus.toUpperCase().replace(/([A-Z])/g, "_$1").replace(/^_/, "");
    // InProgress → IN_PROGRESS, Open → OPEN, etc.
    const statusParam = newStatus === "InProgress" ? "IN_PROGRESS" : newStatus.toUpperCase();
    const res = await apiClient.patch<ApiResponse<BackendIncident>>(
      `${withPathParam(API_ENDPOINTS.incidents.staff, id)}/status?status=${statusParam}`,
    );
    return mapToUI(res.data.results ?? { status: beStatus } as BackendIncident);
  },

  // ── PATCH /staff/incidents/{id}/assign?staffId={staffId} (FE-33) ─────────
  assignIncident: async (id: string, staffId: string): Promise<IncidentRecord> => {
    const res = await apiClient.patch<ApiResponse<BackendIncident>>(
      `${withPathParam(API_ENDPOINTS.incidents.staff, id)}/assign?staffId=${staffId}`,
    );
    return mapToUI(res.data.results);
  },
};
