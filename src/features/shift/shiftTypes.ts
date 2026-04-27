export type ShiftStatus = "upcoming" | "in_progress" | "completed" | "missed";
export type IncidentSeverity = "critical" | "warning" | "low";
export type IncidentStatus = "open" | "in_progress" | "resolved";

export interface ShiftSchedule {
  id: string; // ID ca làm việc
  date: string; // YYYY-MM-DD
  dayOfWeek: string; // T2, T3...
  shiftType: "morning" | "afternoon" | "night" | "off"; // Sáng, Chiều, Đang nghỉ
  startTime?: string; // 06:00
  endTime?: string; // 14:00
  status: ShiftStatus; // Trạng thái ca trực (áp dụng đối với ngày hôm nay hoặc quá khứ)
}

export interface ShiftIncident {
  id: string; // Ví dụ: INC-2024-089
  severity: IncidentSeverity; // Nguy cấp, Cảnh báo, Thấp
  content: string; // Nội dung
  status: IncidentStatus; // Trạng thái
  deviceId?: string; // Mã thiết bị ảnh hưởng
}

export interface CurrentShiftRecord {
  id: string;
  userId: string;
  stationId: string;
  stationName: string;
  isCheckedIn: boolean; // true nếu đã bấm check-in
  checkInTime?: string; // "14:00:22"
  checkOutTime?: string;
  schedule: ShiftSchedule; // Kèm thông tin lịch
}
