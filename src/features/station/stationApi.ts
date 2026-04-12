import { Station, StationFilters, PaginatedResult } from "./stationTypes";

// Khởi tạo mock data giống UI mẫu
let MOCK_STATIONS: Station[] = [
  {
    id: "1",
    code: "STA-001",
    name: "Bến Thành",
    line: "L1",
    zone: "Quận 1",
    status: "active",
    location: "Chợ Bến Thành, Quận 1",
  },
  {
    id: "2",
    code: "STA-002",
    name: "Nhà hát TP (Opera House)",
    line: "L1",
    zone: "Quận 1",
    status: "active",
    location: "Nhà hát TP, Quận 1",
  },
  {
    id: "3",
    code: "STA-003",
    name: "Ba Son",
    line: "L1",
    zone: "Quận 1",
    status: "inactive",
    location: "Vinhomes Golden River, Quận 1",
  },
  {
    id: "4",
    code: "STA-004",
    name: "Tân Cảng",
    line: "L1",
    zone: "Bình Thạnh",
    status: "active",
    location: "Vinhomes Central Park, Bình Thạnh",
  },
];

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const stationApi = {
  // Lấy danh sách (Search, Filter, Pagination)
  getStations: async (
    filters: StationFilters,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResult<Station>> => {
    await delay(600); // fake network delay
    let data = [...MOCK_STATIONS];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      data = data.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.code.toLowerCase().includes(q) ||
          s.zone.toLowerCase().includes(q)
      );
    }

    if (filters.line) {
      data = data.filter((s) => s.line === filters.line);
    }

    if (filters.status) {
      data = data.filter((s) => s.status === filters.status);
    }

    const total = data.length;
    const start = (page - 1) * limit;
    const paginatedData = data.slice(start, start + limit);

    return { data: paginatedData, total, page, limit };
  },

  // Tạo mới
  createStation: async (
    station: Omit<Station, "id" | "code">
  ): Promise<Station> => {
    await delay(800);
    // Random lỗi 20% để demo error handling (tuỳ chọn)
    if (Math.random() > 0.9) throw new Error("Máy chủ quá tải, vui lòng thử lại!");

    const newCode = `STA-${String(MOCK_STATIONS.length + 1).padStart(3, "0")}`;
    const newStation: Station = {
      ...station,
      id: String(Date.now()),
      code: newCode,
    };
    MOCK_STATIONS.unshift(newStation);
    return newStation;
  },

  // Cập nhật
  updateStation: async (
    id: string,
    updates: Partial<Station>
  ): Promise<Station> => {
    await delay(800);
    const idx = MOCK_STATIONS.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error("Ga không tồn tại");

    MOCK_STATIONS[idx] = { ...MOCK_STATIONS[idx], ...updates };
    return MOCK_STATIONS[idx];
  },

  // Đổi trạng thái (Tạm ngưng / Kích hoạt)
  toggleStatus: async (id: string, newStatus: "active" | "inactive") => {
    await delay(500);
    const idx = MOCK_STATIONS.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error("Ga không tồn tại");

    MOCK_STATIONS[idx].status = newStatus;
    return MOCK_STATIONS[idx];
  },

  // Xoá (ít dùng, thường dùng vô hiệu hoá)
  deleteStation: async (id: string) => {
    await delay(800);
    MOCK_STATIONS = MOCK_STATIONS.filter((s) => s.id !== id);
    return true;
  },
};
