import type {
  IncidentRecord,
  IncidentStatus,
  IncidentFilterParams,
  IncidentFormData,
} from "./incidentTypes";

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

// Mock Timeline store
const MOCK_TIMELINES: Record<string, any[]> = {
  "INC-2024-001": [
    {
      id: "TL-1",
      type: "status_change",
      actorName: "Hệ thống giám sát",
      timestamp: "14:20 - Hôm nay",
      content: "Tự động tạo sự cố: Mất kết nối Heartbeat từ Cổng 04. Mức độ: Critical.",
      newStatus: "Open"
    }
  ]
};

const validateStateTransition = (oldStatus: IncidentStatus, newStatus: IncidentStatus): boolean => {
  if (oldStatus === newStatus) return true;
  switch (oldStatus) {
    case "Open": return newStatus === "Assigned";
    case "Assigned": return newStatus === "InProgress";
    case "InProgress": return newStatus === "Escalated" || newStatus === "Resolved";
    case "Escalated": return newStatus === "InProgress";
    case "Resolved": return newStatus === "Closed";
    case "Closed": return false; // Closed là end state
    default: return false;
  }
};

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

  getIncidentById: async (id: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const incident = MOCK_INCIDENTS.find(i => i.id === id);
        if (!incident) {
          reject(new Error("Không tìm thấy sự cố"));
          return;
        }
        const timeline = MOCK_TIMELINES[id] || [
          {
            id: `TL-GEN-${Date.now()}`,
            type: "status_change",
            actorName: "Hệ thống giám sát",
            timestamp: incident.createdAt + " - Hôm nay",
            content: `Tự động tạo sự cố: ${incident.title}`,
            newStatus: "Open"
          }
        ];
        // Mock SLA
        const detailRecord = {
          ...incident,
          timeline: [...timeline].reverse(), // Mới nhất lên đầu
          slaMinutes: incident.status === "Closed" || incident.status === "Resolved" ? 0 : 45
        };
        resolve(detailRecord);
      }, 600);
    });
  },

  createIncident: async (data: IncidentFormData): Promise<IncidentRecord> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock infer deviceType from deviceId prefix
        let cType = "gate";
        if (data.deviceId.startsWith("TVM")) cType = "tvm";
        if (data.deviceId.startsWith("LED")) cType = "led";

        const newIncId = `INC-2024-00${MOCK_INCIDENTS.length + 1}`;
        const newInc: IncidentRecord = {
          id: newIncId,
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

        MOCK_TIMELINES[newIncId] = [{
          id: `TL-${Date.now()}`,
          type: "status_change",
          actorName: "Nhân viên ga",
          timestamp: newInc.createdAt + " - Hôm nay",
          content: `Tạo thẻ sự cố: ${newInc.title}`,
          newStatus: "Open"
        }];

        resolve(newInc);
      }, 800);
    });
  },

  updateIncidentStatus: async (id: string, newStatus: IncidentStatus, actorName: string = "Nhân viên ga"): Promise<IncidentRecord | null> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const idx = MOCK_INCIDENTS.findIndex(i => i.id === id);
        if (idx === -1) {
          reject(new Error("Không tìm thấy Incident"));
          return;
        }

        const oldStatus = MOCK_INCIDENTS[idx].status;
        
        // Validate State Diagram
        if (!validateStateTransition(oldStatus, newStatus)) {
          reject(new Error(`Không thể chuyển đổi trạng thái từ ${oldStatus} sang ${newStatus} theo quy trình!`));
          return;
        }

        MOCK_INCIDENTS[idx].status = newStatus;
        MOCK_INCIDENTS[idx].updatedAt = new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' });

        // Add timeline event
        if (!MOCK_TIMELINES[id]) MOCK_TIMELINES[id] = [];
        MOCK_TIMELINES[id].push({
          id: `TL-${Date.now()}`,
          type: "status_change",
          actorName,
          timestamp: MOCK_INCIDENTS[idx].updatedAt + " - Hôm nay",
          content: `Thay đổi trạng thái từ ${oldStatus} thành ${newStatus}.`,
          oldStatus,
          newStatus
        });

        resolve({ ...MOCK_INCIDENTS[idx] });
      }, 300);
    });
  },

  assignIncident: async (id: string, assigneeName: string, actorName: string = "Nhân viên ga"): Promise<IncidentRecord> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const idx = MOCK_INCIDENTS.findIndex(i => i.id === id);
        if (idx === -1) {
          reject(new Error("Không tìm thấy Incident"));
          return;
        }

        const oldStatus = MOCK_INCIDENTS[idx].status;
        if (!validateStateTransition(oldStatus, "Assigned") && oldStatus !== "Assigned") {
           reject(new Error(`Chỉ có thể phân công khi thẻ đang Open!`));
           return;
        }

        MOCK_INCIDENTS[idx].assigneeName = assigneeName;
        MOCK_INCIDENTS[idx].status = "Assigned";
        MOCK_INCIDENTS[idx].updatedAt = new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' });

        if (!MOCK_TIMELINES[id]) MOCK_TIMELINES[id] = [];
        MOCK_TIMELINES[id].push({
          id: `TL-${Date.now()}`,
          type: "assigned",
          actorName,
          timestamp: MOCK_INCIDENTS[idx].updatedAt + " - Hôm nay",
          content: `Đã phân công xử lý cho kỹ thuật viên: ${assigneeName}.`,
          oldStatus,
          newStatus: "Assigned"
        });

        resolve({ ...MOCK_INCIDENTS[idx] });
      }, 400);
    });
  },

  addTimelineComment: async (id: string, content: string, actorName: string = "Nhân viên ga"): Promise<any> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!MOCK_TIMELINES[id]) MOCK_TIMELINES[id] = [];
        const newEvent = {
          id: `TL-${Date.now()}`,
          type: "comment",
          actorName,
          timestamp: new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' }) + " - Hôm nay",
          content
        };
        MOCK_TIMELINES[id].push(newEvent);
        resolve(newEvent);
      }, 300);
    });
  }
};
