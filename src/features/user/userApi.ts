import { User, UserRole } from "./userTypes";
import { apiClient } from "@features/httpClient/ApiClient";

// Type returned from backend
export interface BackendUser {
  userId: string;
  fullName: string;
  email: string;
  phone?: string;
  status: "ACTIVE" | "INACTIVE";
  roles: { roleId: string; roleName: string }[];
  address?: string;
  dob?: string;
}

export interface ApiResponse<T> {
  code: number;
  results: T;
}

// Convert Backend => UI
function mapBackendUserToUI(b: BackendUser): User {
  let role: UserRole = "passenger";
  if (b.roles && b.roles.length > 0) {
    const roleName = b.roles[0].roleName.toLowerCase();
    if (roleName.includes("admin")) role = "admin";
    else if (roleName.includes("staff")) role = "staff";
    else if (roleName.includes("scanner")) role = "scanner";
  }

  return {
    id: b.userId,
    name: b.fullName || "Chưa cập nhật",
    email: b.email || "",
    role: role,
    status: b.status.toLowerCase() as "active" | "inactive",
    lastLogin: undefined,
  };
}

export const userApi = {
  getUsers: async (): Promise<User[]> => {
    const res = await apiClient.get<ApiResponse<BackendUser[]>>("/users");
    const data = res.data.results || [];
    return data.map(mapBackendUserToUI);
  },

  createUser: async (data: any): Promise<User> => {
    // Backend hiện chưa có API tạo từ Admin
    console.warn("Chưa có API POST /users, fake data...");
    return {
      id: `u${Date.now()}`,
      name: data.name,
      email: data.email,
      role: data.role,
      status: data.status || "active",
    };
  },

  updateUser: async (id: string, updates: Partial<User>): Promise<User> => {
    // Admin update status
    if (updates.status) {
      const statusToUpdate = updates.status.toUpperCase() as "ACTIVE" | "INACTIVE";
      const res = await apiClient.patch<ApiResponse<BackendUser>>(
        `/users/${id}/status?status=${statusToUpdate}`
      );
      return mapBackendUserToUI(res.data.results);
    }
    throw new Error("API Backend hiện chỉ hỗ trợ cập nhật Trạng thái (Khoá/Mở).");
  },

  deleteUser: async (id: string): Promise<void> => {
    throw new Error("Backend chưa hỗ trợ xoá người dùng hoàn toàn, chỉ được khoá (Inactive).");
  }
};

// ==========================================
// API DÀNH CHO CÁ NHÂN (MY-PROFILE)
// ==========================================
export async function getMyProfile() {
  const res = await apiClient.get<ApiResponse<BackendUser>>("/users/my-profile");
  return res.data.results;
}

export async function updateMyProfile(data: any) {
  const res = await apiClient.put<ApiResponse<BackendUser>>("/users/my-profile", data);
  return res.data.results;
}
