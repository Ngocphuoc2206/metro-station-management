export type AuditAction = "UPDATE" | "CREATE" | "DELETE" | "LOGIN" | "LOGOUT" | "EXPORT";
export type AuditResult = "SUCCESS" | "FAILED";

export interface AuditActor {
  username: string; // e.g. admin_super, sys_internal
  initials: string; // e.g. AS, JD, SA (for avatar fallback)
}

export interface AuditLog {
  id: string;
  timestamp: string; // ISO string format preferred, but mockup shows "20/05/2024 \n 14:25:31"
  dateFormatted: string; // "20/05/2024"
  timeFormatted: string; // "14:25:31"
  actor: AuditActor;
  action: AuditAction;
  target: string; // e.g. Bảng giá vé (Q1/2024)
  result: AuditResult;
  ipAddress: string; // e.g. 118.69.15.242
}

export interface AuditLogFilterParams {
  dateRange: string; // "all", "today", "yesterday", "this_week", "this_month"
  actor: string; // "all", "admin", "manager", "system"
  action: string; // "all", "CREATE", "UPDATE", "DELETE", "LOGIN"
}
