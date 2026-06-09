import { apiClient } from "@features/httpClient/ApiClient";
import { API_ENDPOINTS, withPathParam } from "@features/httpClient/apiEndpoints";
import { unwrapApiResponse } from "@features/httpClient/unwrap";
import type {
  BackendIncidentStatus,
  IncidentComment,
  IncidentDetailRecord,
  IncidentFilterParams,
  IncidentFormData,
  IncidentPriority,
  IncidentRecord,
  IncidentSeverity,
  IncidentStatus,
  IncidentTimelineEvent,
} from "./incidentTypes";

type BackendIncident = {
  id?: string;
  title?: string;
  description?: string;
  stationId?: string;
  stationName?: string;
  gateId?: string | null;
  gateCode?: string | null;
  deviceId?: string | null;
  deviceCode?: string | null;
  priority?: string;
  status?: string;
  reporterName?: string;
  assigneeName?: string;
  createdAt?: string;
  updatedAt?: string;
  comments?: BackendIncidentComment[];
};

type BackendIncidentComment = {
  id?: string;
  userId?: string;
  userName?: string;
  content?: string;
  createdAt?: string;
};

const priorityValues: IncidentPriority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const statusValues: BackendIncidentStatus[] = ["OPEN", "APPROVED", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"];

function normalizePriority(value?: string): IncidentPriority {
  const normalized = (value ?? "").toUpperCase();
  return priorityValues.includes(normalized as IncidentPriority)
    ? (normalized as IncidentPriority)
    : "LOW";
}

function priorityToSeverity(priority: IncidentPriority): IncidentSeverity {
  return priority.toLowerCase() as IncidentSeverity;
}

function normalizeBackendStatus(value?: string): BackendIncidentStatus {
  const normalized = (value ?? "").toUpperCase();
  return statusValues.includes(normalized as BackendIncidentStatus)
    ? (normalized as BackendIncidentStatus)
    : "OPEN";
}

function backendStatusToUi(status: BackendIncidentStatus): IncidentStatus {
  if (status === "APPROVED") return "Approved";
  if (status === "ASSIGNED") return "Assigned";
  if (status === "IN_PROGRESS") return "InProgress";
  if (status === "RESOLVED") return "Resolved";
  if (status === "CLOSED") return "Closed";
  return "Open";
}

function uiStatusToBackend(status: IncidentStatus | BackendIncidentStatus): BackendIncidentStatus {
  const direct = normalizeBackendStatus(status);
  if (direct !== "OPEN" || status === "OPEN" || status === "Open") return direct;
  if (status === "Approved") return "APPROVED";
  if (status === "Assigned") return "ASSIGNED";
  if (status === "InProgress") return "IN_PROGRESS";
  if (status === "Resolved") return "RESOLVED";
  if (status === "Closed") return "CLOSED";
  return "OPEN";
}

function severityToPriority(severity?: IncidentSeverity): IncidentPriority {
  return normalizePriority(severity?.toUpperCase());
}

function mapComment(comment: BackendIncidentComment): IncidentComment {
  return {
    id: comment.id ?? "",
    userId: comment.userId,
    userName: comment.userName,
    content: comment.content ?? "",
    createdAt: comment.createdAt ?? "",
  };
}

function mapCommentToTimeline(comment: IncidentComment, index: number): IncidentTimelineEvent {
  const isSystem = comment.content.startsWith("[");
  return {
    id: comment.id || `comment-${index}`,
    type: isSystem ? "status_change" : "comment",
    actorName: comment.userName || (isSystem ? "He thong" : "Nhan vien"),
    timestamp: comment.createdAt,
    content: comment.content,
  };
}

function cleanUuid(id: string): string {
  const match = id.trim().match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/);
  return match ? match[0] : id.trim();
}

function mapIncident(item: BackendIncident): IncidentRecord {
  const priority = normalizePriority(item.priority);
  const backendStatus = normalizeBackendStatus(item.status);
  const comments = Array.isArray(item.comments) ? item.comments.map(mapComment) : [];
  const assigneeName = item.assigneeName?.trim();
  const hasRealAssignee =
    assigneeName &&
    !["chua ban giao", "chưa bàn giao", "chua phe duyet", "chưa phê duyệt"].includes(
      assigneeName.toLowerCase(),
    );

  return {
    id: cleanUuid(item.id ?? ""),
    title: item.title ?? "Khong co tieu de",
    description: item.description ?? "",
    stationId: item.stationId ?? "",
    stationName: item.stationName,
    gateId: item.gateId,
    gateCode: item.gateCode,
    deviceId: item.deviceId,
    deviceCode: item.deviceCode,
    deviceType: item.deviceId ? "device" : item.gateId ? "gate" : "station",
    priority,
    severity: priorityToSeverity(priority),
    backendStatus,
    status: backendStatusToUi(backendStatus),
    reporterName: item.reporterName,
    assigneeName: hasRealAssignee ? assigneeName : undefined,
    createdAt: item.createdAt ?? "",
    updatedAt: item.updatedAt ?? item.createdAt ?? "",
    comments,
  };
}

function toDetail(item: BackendIncident): IncidentDetailRecord {
  const mapped = mapIncident(item);
  return {
    ...mapped,
    timeline: (mapped.comments ?? []).map(mapCommentToTimeline),
  };
}

export const incidentApi = {
  getIncidents: async (filters: IncidentFilterParams = {}): Promise<IncidentRecord[]> => {
    const params: Record<string, string> = {};
    if (filters.status) params.status = filters.status;
    if (filters.priority) params.priority = filters.priority;
    else if (filters.severity && filters.severity !== "all") {
      params.priority = severityToPriority(filters.severity);
    }
    if (filters.stationId && filters.stationId !== "all") params.stationId = filters.stationId;

    const res = await apiClient.get(API_ENDPOINTS.incidents.staff, { params });
    const data = unwrapApiResponse<BackendIncident[]>(res.data);
    return Array.isArray(data) ? data.map(mapIncident).filter((incident) => incident.id) : [];
  },

  getIncidentsByStatus: async (status: BackendIncidentStatus | IncidentStatus): Promise<IncidentRecord[]> => {
    return incidentApi.getIncidents({ status: uiStatusToBackend(status) });
  },

  getIncidentById: async (id: string): Promise<IncidentDetailRecord> => {
    // Backend doesn't have GET endpoint for detail, so we fetch all incidents and find the one we need
    const incidents = await incidentApi.getIncidents({});
    const found = incidents.find((i) => i.id === id);
    if (!found) throw new Error("Incident not found");
    return toDetail(
      found as unknown as BackendIncident
    );
  },

  getIncidentByIdAdmin: async (id: string): Promise<IncidentDetailRecord> => {
    // Backend doesn't have GET endpoint for detail, so we fetch all incidents and find the one we need
    const incidents = await incidentApi.getIncidents({});
    const found = incidents.find((i) => i.id === id);
    if (!found) throw new Error("Incident not found");
    return toDetail(
      found as unknown as BackendIncident
    );
  },

  createIncident: async (data: IncidentFormData): Promise<IncidentRecord> => {
    const res = await apiClient.post(API_ENDPOINTS.incidents.staff, {
      title: data.title,
      description: data.description ?? "",
      stationId: data.stationId,
      gateId: data.gateId || null,
      deviceId: data.deviceId || null,
      priority: data.priority ?? severityToPriority(data.severity),
    });
    return mapIncident(unwrapApiResponse<BackendIncident>(res.data));
  },

  addTimelineComment: async (id: string, content: string): Promise<IncidentComment> => {
    const res = await apiClient.post(
      `${withPathParam(API_ENDPOINTS.incidents.staff, id)}/comments`,
      content,
      { headers: { "Content-Type": "text/plain" } },
    );
    return mapComment(unwrapApiResponse<BackendIncidentComment>(res.data));
  },

  approveIncident: async (id: string): Promise<IncidentRecord> => {
    const res = await apiClient.patch(`${withPathParam(API_ENDPOINTS.incidents.staff, id)}/approve`);
    return mapIncident(unwrapApiResponse<BackendIncident>(res.data));
  },

  startIncident: async (id: string): Promise<IncidentRecord> => {
    const res = await apiClient.patch(`${withPathParam(API_ENDPOINTS.incidents.staff, id)}/start`);
    return mapIncident(unwrapApiResponse<BackendIncident>(res.data));
  },

  resolveIncident: async (id: string): Promise<IncidentRecord> => {
    const res = await apiClient.patch(`${withPathParam(API_ENDPOINTS.incidents.staff, id)}/resolve`);
    return mapIncident(unwrapApiResponse<BackendIncident>(res.data));
  },

  closeIncident: async (id: string): Promise<IncidentRecord> => {
    const res = await apiClient.patch(`${withPathParam(API_ENDPOINTS.incidents.staff, id)}/close`);
    return mapIncident(unwrapApiResponse<BackendIncident>(res.data));
  },

  reopenIncident: async (id: string): Promise<IncidentRecord> => {
    const res = await apiClient.patch(`${withPathParam(API_ENDPOINTS.incidents.staff, id)}/reopen`);
    return mapIncident(unwrapApiResponse<BackendIncident>(res.data));
  },

  updateIncidentStatus: async (
    id: string,
    status: IncidentStatus | BackendIncidentStatus,
  ): Promise<IncidentRecord> => {
    const backendStatus = uiStatusToBackend(status);
    if (backendStatus === "APPROVED" || backendStatus === "ASSIGNED") {
      return incidentApi.approveIncident(id);
    }
    if (backendStatus === "IN_PROGRESS") return incidentApi.startIncident(id);
    if (backendStatus === "RESOLVED") return incidentApi.resolveIncident(id);
    if (backendStatus === "CLOSED") return incidentApi.closeIncident(id);
    const res = await apiClient.get(withPathParam(API_ENDPOINTS.incidents.staff, id));
    return mapIncident(unwrapApiResponse<BackendIncident>(res.data));
  },

  assignIncident: async (id: string, staffId: string): Promise<IncidentRecord> => {
    void staffId;
    return incidentApi.approveIncident(id);
  },

  uploadMedia: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await apiClient.post(API_ENDPOINTS.media.upload, formData, {
        headers: {
          "Content-Type": undefined,
        },
      });
      const data = unwrapApiResponse<unknown>(res.data);
      if (typeof data === "string") return data;
      if (data && typeof data === "object") {
        const dataObj = data as Record<string, unknown>;
        return String(dataObj.url ?? dataObj.path ?? data);
      }
      return "";
    } catch (err) {
      const axiosError = err as { response?: { data?: unknown } };
      console.error("Upload Media Error Response:", axiosError.response?.data);
      throw err;
    }
  },
};
