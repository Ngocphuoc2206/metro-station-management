import type { IncidentRecord, IncidentStatus, IncidentFilterParams } from "./incidentTypes";

// Mock Data gốc
let MOCK_INCIDENTS: IncidentRecord[] = [
  {
    id: "INC-2024-001",
    title: "Lỗi quét mã QR tại Cổng 04",
    stationId: "G-STN-001",
    deviceId: "GATE-04",
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
    deviceId: "TVM-03",
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
    deviceId: "LED-02",
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
    deviceId: "GATE-01",
    deviceType: "gate",
    severity: "high",
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

  createIncident: async (data: IncidentFormData): Promise<IncidentRecord> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock infer deviceType from deviceId prefix
        let cType = "gate";
        if (data.deviceId.startsWith("TVM")) cType = "tvm";
        if (data.deviceId.startsWith("LED")) cType = "led";

        const newInc: IncidentRecord = {
          id: `INC-2024-00${MOCK_INCIDENTS.length + 1}`,
          title: data.title,
          stationId: "G-STN-001", // Mặc định ga hiện tại
          deviceId: data.deviceId,
          deviceType: cType,
          severity: data.severity,
          status: "Open",
          description: data.description,
          createdAt: new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' }),
          updatedAt: new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })
        };
        MOCK_INCIDENTS.unshift(newInc);
        resolve(newInc);
      }, 800);
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
