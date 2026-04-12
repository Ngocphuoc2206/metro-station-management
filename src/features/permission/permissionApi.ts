import { RoleDetail, PermissionModule, RoleId } from "./permissionTypes";

const MOCK_MODULES: PermissionModule[] = [
  { id: "stations", name: "Quản lý Ga", description: "Thêm, sửa, xóa thông tin nhà ga" },
  { id: "routes", name: "Quản lý Tuyến", description: "Quản lý lộ trình và sơ đồ tuyến" },
  { id: "tickets", name: "Loại vé", description: "Cấu hình loại vé và chính sách" },
  { id: "fares", name: "Bảng giá", description: "Thay đổi giá vé, bảng giá toàn hệ thống" },
  { id: "reports", name: "Báo cáo", description: "Truy xuất dữ liệu doanh thu & lưu lượng" },
  { id: "audit", name: "Nhật ký hệ thống", description: "Audit logs và lịch sử thao tác" },
  { id: "users", name: "Quản lý Người dùng", description: "Quản lý vai trò và tài khoản nhân viên" },
  { id: "profile", name: "Thông tin cá nhân", description: "Xem và chỉnh sửa hồ sơ bản thân" },
];

let fakeRoles: RoleDetail[] = [
  {
    id: "admin",
    name: "Quản trị viên",
    description: "Người dùng có quyền cao nhất. Quản trị được toàn bộ hệ thống, thiết lập phân quyền và thay đổi dữ liệu lõi.",
    createdDate: "01/01/2024",
    creator: "Hệ thống",
    userCount: 5,
    permissions: ["stations", "routes", "tickets", "fares", "reports", "audit", "users", "profile"],
  },
  {
    id: "staff",
    name: "Nhân viên Ga",
    description: "Nhân viên làm việc tại các nhà ga. Có quyền cập nhật trạng thái thiết bị và quản lý hành khách cục bộ.",
    createdDate: "15/05/2024",
    creator: "Admin User",
    userCount: 154,
    permissions: ["stations", "tickets", "reports", "profile"],
  },
  {
    id: "scanner",
    name: "Nhân viên Soát vé",
    description: "Kiểm tra và hỗ trợ quét vé tại các điểm cổng tự động ga tàu.",
    createdDate: "20/05/2024",
    creator: "Admin User",
    userCount: 89,
    permissions: ["tickets", "profile"],
  },
  {
    id: "passenger",
    name: "Hành khách",
    description: "Người dùng cuối sử dụng dịch vụ Metro. Vai trò này có quyền hạn hạn chế nhất, chỉ xem được thông tin chung và cá nhân.",
    createdDate: "01/01/2024",
    creator: "Hệ thống",
    userCount: 2450122,
    permissions: ["profile"],
  },
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const permissionApi = {
  getModules: async (): Promise<PermissionModule[]> => {
    await delay(300);
    return MOCK_MODULES;
  },

  getRoles: async (): Promise<RoleDetail[]> => {
    await delay(500);
    return JSON.parse(JSON.stringify(fakeRoles));
  },

  updateRolePermissions: async (roleId: RoleId, newPermissions: string[]): Promise<RoleDetail> => {
    await delay(600);
    const index = fakeRoles.findIndex((r) => r.id === roleId);
    if (index === -1) throw new Error("Không tìm thấy vai trò");

    // Chỉ Admin mới có quyền cập nhật quyền? (Ở đây mình giả lập Admin đang thao tác)
    fakeRoles[index].permissions = [...newPermissions];
    return { ...fakeRoles[index] };
  },
};
