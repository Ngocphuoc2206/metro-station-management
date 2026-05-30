import { apiClient } from "@features/httpClient/ApiClient";
import { API_ENDPOINTS, ApiResponse, withPathParam } from "@features/httpClient/apiEndpoints";
import { RoleDetail, PermissionModule, RoleId } from "./permissionTypes";

// ── Backend response shapes ───────────────────────────────────────────────────
interface BackendPermission {
  permissionId?: string;
  id?: string;
  name: string;
  description?: string;
  module?: string;
}

interface BackendRole {
  roleId: string;
  roleName?: string;
  name?: string;
  description?: string;
  createdAt?: string;
  createdBy?: string;
  userCount?: number;
  permissions?: BackendPermission[];
}

interface PermissionMatrixResponse {
  roles?: BackendRole[];
  permissions?: BackendPermission[];
  // backend có thể trả các shape khác nhau
  [key: string]: unknown;
}

// ── Map Backend → UI ──────────────────────────────────────────────────────────
function mapToRole(b: BackendRole): RoleDetail {
  return {
    id: b.roleId as RoleId,
    name: b.roleName ?? b.name ?? b.roleId,
    description: b.description ?? "",
    createdDate: b.createdAt
      ? new Date(b.createdAt).toLocaleDateString("vi-VN")
      : "—",
    creator: b.createdBy ?? "Hệ thống",
    userCount: b.userCount ?? 0,
    permissions: (b.permissions ?? []).map(
      (p) => p.permissionId ?? p.id ?? p.name
    ),
  };
}

function mapToModule(p: BackendPermission, idx: number): PermissionModule {
  return {
    id: p.permissionId ?? p.id ?? `mod-${idx}`,
    name: p.name,
    description: p.description ?? "",
  };
}

export const permissionApi = {
  // ── GET /permissions/matrix (FE-25) ──────────────────────────────────────
  getModules: async (): Promise<PermissionModule[]> => {
    const res = await apiClient.get<ApiResponse<PermissionMatrixResponse>>(
      API_ENDPOINTS.permissions.matrix
    );
    const data = res.data.results;
    const permissions: BackendPermission[] = Array.isArray(data)
      ? (data as BackendPermission[])
      : (data?.permissions ?? []);
    return permissions.map(mapToModule);
  },

  getRoles: async (): Promise<RoleDetail[]> => {
    const res = await apiClient.get<ApiResponse<PermissionMatrixResponse>>(
      API_ENDPOINTS.permissions.matrix
    );
    const data = res.data.results;
    const roles: BackendRole[] = Array.isArray(data)
      ? []
      : (data?.roles ?? []);
    return roles.map(mapToRole);
  },

  // ── PUT /permissions/roles/{roleId} (FE-25) ───────────────────────────────
  // Backend spec: body là mảng string thẳng ["VIEW_STATION", "CREATE_STATION", ...]
  updateRolePermissions: async (
    roleId: RoleId,
    newPermissions: string[]
  ): Promise<RoleDetail> => {
    const res = await apiClient.put<ApiResponse<BackendRole>>(
      withPathParam(API_ENDPOINTS.permissions.roles, roleId),
      newPermissions  // Gửi array thẳng, KHÔNG bọc trong object
    );
    return mapToRole(res.data.results);
  },
};
