export type IncidentStatus = 
  | "Open"
  | "Assigned"
  | "InProgress"
  | "Escalated"
  | "Resolved"
  | "Closed";

export type IncidentSeverity = "critical" | "warning" | "low";

// Cột Kanban tương ứng để gom nhóm theo UI
export type KanbanColumnKey = "TODO" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export interface IncidentRecord {
  id: string; // VD: INC-2024-001
  title: string; // Lỗi quét mã QR tại Cổng 04
  stationId: string; // G-STN-001
  deviceType: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  assigneeName?: string; // Tên nhân viên được giao xử lý
  createdAt: string; // 14:20 hoặc timestamp
  updatedAt: string;
}

export interface IncidentFilterParams {
  stationId?: string;
  deviceType?: string;
  severity?: IncidentSeverity;
}
