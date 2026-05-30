export type IncidentStatus = 
  | "Open"
  | "Assigned"
  | "InProgress"
  | "Escalated"
  | "Resolved"
  | "Closed";

export type IncidentSeverity = "low" | "medium" | "high" | "critical";

// Cột Kanban tương ứng để gom nhóm theo UI
export type KanbanColumnKey = "TODO" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export interface IncidentRecord {
  id: string; // VD: INC-2024-001
  title: string; // Lỗi quét mã QR tại Cổng 04
  stationId: string; // G-STN-001
  deviceId: string; // Tách làm deviceId riêng cho chuẩn UI form mới
  deviceType: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  assigneeName?: string; // Tên nhân viên được giao xử lý
  description?: string; // Thông tin mô tả
  createdAt: string; // 14:20 hoặc timestamp
  updatedAt: string;
}

export interface IncidentFormData {
  title: string;
  stationId: string;   // bắt buộc theo BE
  deviceId?: string;
  gateId?: string;
  severity: IncidentSeverity;
  description?: string;
  images?: File[];
}

export interface IncidentFilterParams {
  stationId?: string;
  deviceType?: string;
  severity?: IncidentSeverity;
}

export type TimelineEventType = "comment" | "status_change" | "assigned" | "escalated";

export interface IncidentTimelineEvent {
  id: string;
  type: TimelineEventType;
  actorName: string;
  timestamp: string; // "14:35 - Hôm nay"
  content: string; // Nội dung comment hoặc mô tả thay đổi trạng thái
  oldStatus?: IncidentStatus;
  newStatus?: IncidentStatus;
}

export interface IncidentDetailRecord extends IncidentRecord {
  timeline: IncidentTimelineEvent[];
  slaMinutes?: number; // Ví dụ 45 phút còn lại
}
