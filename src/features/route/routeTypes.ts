export interface RouteStation {
  id: string; // unique mapping id
  stationId: string;
  stationName: string;
  stationDetail: string; // e.g. "Ga trung tâm / Kết nối Line 01, 02"
  sequenceOrder: number;
}

export interface Route {
  id: string;
  name: string; // e.g. "Line 01 - Metro Blue"
  description: string;
  color: string; // e.g. "#3b82f6" (blue)
  status: "active" | "inactive" | "maintenance"; // "Đang hoạt động", "Tạm dừng", "Dự án"
  stationsCount: number;
  
  // Operating Params
  startTime: string; // e.g. "05:00"
  endTime: string; // e.g. "23:30"
  headwayMinutes: number; // e.g. 5
  
  stations: RouteStation[];
}
