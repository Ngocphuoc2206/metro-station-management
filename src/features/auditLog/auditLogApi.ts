import { AuditLog, AuditLogFilterParams } from "./auditLogTypes";

// Mockup Data
const generateMockLogs = (): AuditLog[] => {
  return [
    {
      id: "log_1",
      dateFormatted: "20/05/2024",
      timeFormatted: "14:25:31",
      timestamp: "2024-05-20T14:25:31Z",
      actor: { username: "admin_super", initials: "" }, // Will render avatar or generic admin icon
      action: "UPDATE",
      target: "Bảng giá vé (Q1/2024)",
      result: "SUCCESS",
      ipAddress: "118.69.15.242",
    },
    {
      id: "log_2",
      dateFormatted: "20/05/2024",
      timeFormatted: "13:10:05",
      timestamp: "2024-05-20T13:10:05Z",
      actor: { username: "manager_ben_thanh", initials: "MB" }, // Avatar badge fallback
      action: "CREATE",
      target: "Thêm nhân viên mới #ST-442",
      result: "SUCCESS",
      ipAddress: "171.244.1.88",
    },
    {
      id: "log_3",
      dateFormatted: "20/05/2024",
      timeFormatted: "12:44:12",
      timestamp: "2024-05-20T12:44:12Z",
      actor: { username: "guest_admin_04", initials: "JD" },
      action: "DELETE",
      target: "Báo cáo doanh thu tháng 4",
      result: "FAILED",
      ipAddress: "27.72.63.101",
    },
    {
      id: "log_4",
      dateFormatted: "20/05/2024",
      timeFormatted: "09:12:00",
      timestamp: "2024-05-20T09:12:00Z",
      actor: { username: "sys_internal", initials: "SA" },
      action: "LOGIN",
      target: "Hệ thống trung tâm",
      result: "SUCCESS",
      ipAddress: "::1",
    },
    {
      id: "log_5",
      dateFormatted: "19/05/2024",
      timeFormatted: "16:20:11",
      timestamp: "2024-05-19T16:20:11Z",
      actor: { username: "admin_super", initials: "" },
      action: "DELETE",
      target: "Tuyến Metro số 2 (Test)",
      result: "SUCCESS",
      ipAddress: "118.69.15.242",
    },
  ];
};

const MOCK_LOGS = generateMockLogs();

export const auditLogApi = {
  getLogs: async (
    params: AuditLogFilterParams,
    page: number = 1,
    limit: number = 4
  ): Promise<{ data: AuditLog[]; total: number }> => {
    // Simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 400));

    let filtered = [...MOCK_LOGS];

    // Filter Logic
    if (params.action && params.action !== "all") {
      filtered = filtered.filter((log) => log.action === params.action);
    }
    
    // In real app, we filter by actor type. For mock, just do exact/partial string simple check
    if (params.actor && params.actor !== "all") {
       if (params.actor === "admin") {
         filtered = filtered.filter((log) => log.actor.username.includes("admin"));
       } else if (params.actor === "system") {
         filtered = filtered.filter((log) => log.actor.username.includes("sys"));
       }
    }

    // Phân trang
    const total = filtered.length; // Số lượng sau khi lọc
    // Để mock pagination giống mockup ("Hiển thị 1 - 4 của 2,450 nhật ký")
    const MOCK_TOTAL_DB_RECORDS = total === MOCK_LOGS.length ? 2450 : total; 

    // Paginate data ảo
    const startIndex = (page - 1) * limit;
    const paginatedData = filtered.slice(startIndex, startIndex + limit);

    // Xử lý bù đắp data giả nếu page lớn
    // Để demo pagination dài, ta trả về lại list ảo
    
    return { data: paginatedData, total: MOCK_TOTAL_DB_RECORDS };
  },
};
