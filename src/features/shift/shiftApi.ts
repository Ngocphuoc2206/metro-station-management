import type {
  ShiftSchedule,
  ShiftIncident,
  CurrentShiftRecord,
} from "./shiftTypes";

// Mock Data
let currentShiftStatus = false; // Mặc định chưa check-in

const MOCK_SCHEDULE: ShiftSchedule[] = [
  { id: "S1", date: "2024-05-20", dayOfWeek: "T2", shiftType: "morning", startTime: "06:00", endTime: "14:00", status: "completed" },
  { id: "S2", date: "2024-05-21", dayOfWeek: "T3", shiftType: "morning", startTime: "06:00", endTime: "14:00", status: "completed" },
  { id: "S3", date: "2024-05-22", dayOfWeek: "T4", shiftType: "afternoon", startTime: "14:00", endTime: "22:00", status: "in_progress" },
  { id: "S4", date: "2024-05-23", dayOfWeek: "T5", shiftType: "afternoon", startTime: "14:00", endTime: "22:00", status: "upcoming" },
  { id: "S5", date: "2024-05-24", dayOfWeek: "T6", shiftType: "afternoon", startTime: "14:00", endTime: "22:00", status: "upcoming" },
  { id: "S6", date: "2024-05-25", dayOfWeek: "T7", shiftType: "off", status: "upcoming" },
  { id: "S7", date: "2024-05-26", dayOfWeek: "CN", shiftType: "off", status: "upcoming" },
];

const MOCK_INCIDENTS: ShiftIncident[] = [
  { id: "INC-2024-089", severity: "critical", content: "Cổng G-STN-003 mất kết nối hoàn toàn, không thể quét thẻ.", status: "in_progress" },
  { id: "INC-2024-092", severity: "warning", content: "Màn hình hiển thị tại quầy vé số 2 bị nhấp nháy liên tục.", status: "open" },
  { id: "INC-2024-075", severity: "low", content: "Vệ sinh khu vực cổng soát vé hứng nước ứ đọng sau ca trực.", status: "resolved" },
];

export const shiftApi = {
  getWeeklySchedule: async (): Promise<ShiftSchedule[]> => {
    return new Promise((resolve) => setTimeout(() => resolve(MOCK_SCHEDULE), 500));
  },
  
  getCurrentShift: async (): Promise<CurrentShiftRecord> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: "Current-S3",
          userId: "Staff-1",
          stationId: "STN-BenThanh",
          stationName: "Ga làm việc: Bến Thành",
          isCheckedIn: currentShiftStatus,
          schedule: MOCK_SCHEDULE[2], // Giả định hôm nay là T4
        });
      }, 300);
    });
  },

  checkIn: async (): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        currentShiftStatus = true;
        resolve(true);
      }, 600);
    });
  },

  checkOut: async (): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        currentShiftStatus = false; // Reset trạng thái
        resolve(true);
      }, 600);
    });
  },

  getShiftIncidents: async (): Promise<ShiftIncident[]> => {
    return new Promise((resolve) => setTimeout(() => resolve(MOCK_INCIDENTS), 500));
  }
};
