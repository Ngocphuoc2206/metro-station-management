import type { IncidentRecord, IncidentStatus, IncidentFilterParams } from "./incidentTypes";

// Mock Data gốc
let MOCK_INCIDENTS: IncidentRecord[] = [
  {
    id: "INC-2024-001",
    title: "Lỗi quét mã QR tại Cổng 04",
    stationId: "G-STN-001",
    deviceType: "gate",
    severity: "critical",
    status: "Open",
    createdAt: "14:20",
    updatedAt: "14:20",
  },
  {
    id: "INC-2024-002",
    title: "Mất kết nối Máy bán vé TVM-03",
    stationId: "T-STN-003",
    deviceType: "tvm",
    severity: "critical",
    status: "InProgress",
    assigneeName: "Lê Văn Tuấn",
    createdAt: "12:15",
    updatedAt: "12:20",
  },
  {
    id: "INC-2024-003",
    title: "Màn hình hiển thị LED cổng 02 mờ",
    stationId: "G-STN-002",
    deviceType: "led",
    severity: "low",
    status: "Resolved",
    assigneeName: "Nguyễn Thu Hà",
    createdAt: "10:30",
    updatedAt: "11:00",
  },
  {
    id: "INC-2024-004",
    title: "Kẹt thẻ tại Cổng 01",
    stationId: "G-STN-010",
    deviceType: "gate",
    severity: "warning",
    status: "Open",
    assigneeName: "Trần Minh",
    createdAt: "13:50",
    updatedAt: "13:50",
  },
];

export const incidentApi = {
  // Trả về danh sách áp dụng filter (nếu có)
  getIncidents: async (filters?: IncidentFilterParams): Promise<IncidentRecord[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        let results = [...MOCK_INCIDENTS];

        if (filters?.stationId && filters.stationId !== "all") {
          results = results.filter(i => i.stationId === filters.stationId);
        }
        if (filters?.deviceType && filters.deviceType !== "all") {
          results = results.filter(i => i.deviceType === filters.deviceType);
        }
        if (filters?.severity && filters.severity !== "all" as any) {
          results = results.filter(i => i.severity === filters.severity);
        }

        resolve(results);
      }, 500); // Đội lag một xíu ngầm định call network
    });
  },

  updateIncidentStatus: async (id: string, newStatus: IncidentStatus): Promise<IncidentRecord | null> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const idx = MOCK_INCIDENTS.findIndex(i => i.id === id);
        if (idx === -1) {
          reject(new Error("Không tìm thấy Incident"));
          return;
        }

        // Thực thi logic Validate theo State Diagram (VD: không thể từ Mới Mở nhảy tọt phát qua Đóng)
        // Tuy nhiên trong Mock Kanban, ta cho phép đổi tự do tương ứng với Column kéo thả
        MOCK_INCIDENTS[idx].status = newStatus;
        resolve({ ...MOCK_INCIDENTS[idx] });
      }, 300);
    });
  }
};
