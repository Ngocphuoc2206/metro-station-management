export type UserRole = "admin" | "staff" | "passenger" | "scanner";

export interface User {
  id: string; // UUID
  name: string; // varchar
  email: string; // varchar
  role: UserRole; // varchar
  
  // Các field UI bổ sung
  status: "active" | "inactive";
  lastLogin?: string; // e.g. "08:15, 24/10/2024"
  assignedStationId?: string; // UUID của ga nếu là staff/scanner
  assignedStationName?: string; // Tên hiển thị của ga
}
