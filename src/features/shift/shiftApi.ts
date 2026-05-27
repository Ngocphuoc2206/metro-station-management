import { apiClient } from "@features/httpClient/ApiClient";
import { API_ENDPOINTS, ApiResponse } from "@features/httpClient/apiEndpoints";
import type { ShiftSchedule, CurrentShiftRecord } from "./shiftTypes";

// ── Backend response shapes ────────────────────────────────────────────────────
interface BackendShift {
  shiftId?: string;
  id?: string;
  date?: string;
  dayOfWeek?: string;
  shiftType?: string;
  type?: string;
  startTime?: string;
  endTime?: string;
  status?: string;
  stationId?: string;
  stationName?: string;
  isCheckedIn?: boolean;
  checkedIn?: boolean;
  [key: string]: unknown;
}

function normalizeShiftType(raw?: string): "morning" | "afternoon" | "night" | "off" {
  const v = (raw ?? "").toLowerCase();
  if (v.includes("morning") || v.includes("sang") || v.includes("sáng")) return "morning";
  if (v.includes("afternoon") || v.includes("chieu") || v.includes("chiều")) return "afternoon";
  if (v.includes("night") || v.includes("dem") || v.includes("đêm")) return "night";
  return "off";
}

function normalizeShiftStatus(raw?: string): "completed" | "in_progress" | "upcoming" | "missed" {
  const v = (raw ?? "").toLowerCase();
  if (v.includes("complete") || v.includes("done") || v.includes("finish")) return "completed";
  if (v.includes("progress") || v.includes("active") || v.includes("current")) return "in_progress";
  if (v.includes("missed") || v.includes("absent") || v.includes("off") || v.includes("nghi") || v.includes("nghỉ")) return "missed";
  return "upcoming";
}

function mapShiftToUI(b: BackendShift, idx: number): ShiftSchedule {
  return {
    id: b.shiftId ?? b.id ?? `shift-${idx}`,
    date: b.date ?? "",
    dayOfWeek: b.dayOfWeek ?? "",
    shiftType: normalizeShiftType(b.shiftType ?? b.type),
    startTime: b.startTime ?? "",
    endTime: b.endTime,
    status: normalizeShiftStatus(b.status),
  };
}

export const shiftApi = {
  // ── GET /staff/shifts/weekly (FE-30) ──────────────────────────────────────
  getWeeklySchedule: async (): Promise<ShiftSchedule[]> => {
    const res = await apiClient.get<ApiResponse<BackendShift[]>>(
      `${API_ENDPOINTS.shifts.staff}/weekly`
    );
    const raw = res.data.results;
    if (!Array.isArray(raw)) return [];
    return raw.map(mapShiftToUI);
  },

  // ── GET /staff/shifts/current (FE-30) ─────────────────────────────────────────
  getCurrentShift: async (): Promise<CurrentShiftRecord | null> => {
    try {
      const res = await apiClient.get<ApiResponse<BackendShift>>(
        `${API_ENDPOINTS.shifts.staff}/current`
      );
      const b = res.data.results;
      if (!b) return null; // chưa có ca nào
      return {
        id: b.shiftId ?? b.id ?? "current",
        userId: (b.staffId ?? b.userId ?? "") as string,
        stationId: b.stationId ?? "",
        stationName: b.stationName ?? "Ga làm việc",
        isCheckedIn: b.isCheckedIn ?? b.checkedIn ?? false,
        schedule: mapShiftToUI(b, 0),
      };
    } catch {
      // 400/404 = chưa có ca trực hiện tại — không crash
      return null;
    }
  },

  // ── POST /staff/shifts/check-in (FE-30) — no body, token identifies staff ──
  checkIn: async (): Promise<boolean> => {
    await apiClient.post(
      `${API_ENDPOINTS.shifts.staff}/check-in`,
      // Không gửi body gì cả — BE tự nhận diện qua Token
      undefined,
      { headers: { "Content-Type": "application/json" } }
    );
    return true;
  },

  // ── POST /staff/shifts/check-out (FE-30) ─────────────────────────────────
  checkOut: async (): Promise<boolean> => {
    await apiClient.post(
      `${API_ENDPOINTS.shifts.staff}/check-out`,
      undefined,
      { headers: { "Content-Type": "application/json" } }
    );
    return true;
  },

  // Kept for backward compat with shift-profile page
  getShiftIncidents: async () => [],
};
