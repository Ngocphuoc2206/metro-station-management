export type BackendIncidentStatus =
  | "OPEN"
  | "APPROVED"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CLOSED";

export type IncidentPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type IncidentStatus =
  | "Open"
  | "Approved"
  | "Assigned"
  | "InProgress"
  | "Escalated"
  | "Resolved"
  | "Closed";

export type IncidentSeverity = "low" | "medium" | "high" | "critical";

export type KanbanColumnKey = "TODO" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export interface IncidentComment {
  id: string;
  userId?: string;
  userName?: string;
  content: string;
  createdAt: string;
}

export interface IncidentRecord {
  id: string;
  title: string;
  description?: string;
  stationId: string;
  stationName?: string;
  gateId?: string | null;
  gateCode?: string | null;
  deviceId?: string | null;
  deviceCode?: string | null;
  deviceType: string;
  priority?: IncidentPriority;
  severity: IncidentSeverity;
  backendStatus?: BackendIncidentStatus;
  status: IncidentStatus;
  reporterName?: string;
  assigneeName?: string;
  createdAt: string;
  updatedAt: string;
  comments?: IncidentComment[];
}

export interface IncidentFormData {
  title: string;
  stationId: string;
  gateId?: string;
  deviceId?: string;
  priority?: IncidentPriority;
  severity?: IncidentSeverity;
  description?: string;
}

export interface IncidentFilterParams {
  stationId?: string;
  priority?: IncidentPriority | "";
  severity?: IncidentSeverity | "all";
  status?: BackendIncidentStatus | "";
  deviceType?: string;
}

export type TimelineEventType = "comment" | "status_change" | "assigned";

export interface IncidentTimelineEvent {
  id: string;
  type: TimelineEventType;
  actorName: string;
  timestamp: string;
  content: string;
  oldStatus?: IncidentStatus;
  newStatus?: IncidentStatus;
}

export interface IncidentDetailRecord extends IncidentRecord {
  timeline: IncidentTimelineEvent[];
  slaMinutes?: number;
}
