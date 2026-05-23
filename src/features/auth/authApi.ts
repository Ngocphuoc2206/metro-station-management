import { apiClient } from "@features/httpClient/ApiClient";
import { API_ENDPOINTS } from "@features/httpClient/apiEndpoints";
import type {
  SignupRequest,
  SignupResponse,
  CheckEmailResponse,
  LoginRequest,
  LoginResponse,
  LoginApiResponse,
  RegisterApiResponse,
} from "./types";

export interface IntrospectResponse {
  valid: boolean;
  expiresAt?: string;
}

export interface RefreshResponse {
  token: string;
  refreshToken?: string;
}

// ─── Flag môi trường ──────────────────────────────────────────────────────────
// Đặt NEXT_PUBLIC_USE_MOCK_AUTH=true trong .env.local khi backend chưa chạy
export const USE_MOCK_AUTH = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === "true";

// ─── Mock data cho phát triển UI ─────────────────────────────────────────────
const MOCK_ACCOUNTS: Record<
  string,
  { name: string; role: "admin" | "staff" | "passenger" | "scanner" }
> = {
  "admin@test.vn": { name: "Admin User", role: "admin" },
  "staff@test.vn": { name: "Nguyễn Nhân Viên", role: "staff" },
  "passenger@test.vn": { name: "Trần Hành Khách", role: "passenger" },
  "scanner@test.vn": { name: "Nhân Viên Quét", role: "scanner" },
};

// ─── Map roleName → app role ──────────────────────────────────────────────────
type AppRole = "passenger" | "staff" | "admin" | "scanner";

type RoleLike = {
  roleId?: string;
  roleName?: string;
  name?: string;
  authority?: string;
};

type LoginResultsLike = LoginApiResponse["results"] & {
  role?: string;
  roleId?: string;
  roleName?: string;
  authorities?: RoleLike[];
  permissions?: RoleLike[];
  user?: {
    role?: string;
    roleId?: string;
    roleName?: string;
    roles?: RoleLike[];
    authorities?: RoleLike[];
  };
};

function mapRoleValue(roleValue?: string): AppRole | null {
  const normalized = roleValue?.toUpperCase() ?? "";

  if (normalized.includes("ADMIN")) return "admin";
  if (normalized.includes("STAFF")) return "staff";
  if (normalized.includes("SCANNER")) return "scanner";
  if (normalized.includes("PASSENGER")) return "passenger";

  return null;
}

function decodeJwtPayload(token?: string): Record<string, unknown> | null {
  if (!token) return null;

  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "=",
    );
    const decoded =
      typeof window === "undefined"
        ? Buffer.from(padded, "base64").toString("utf-8")
        : atob(padded);

    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function readRoleLike(role: RoleLike): AppRole | null {
  return (
    mapRoleValue(role.roleName) ??
    mapRoleValue(role.roleId) ??
    mapRoleValue(role.name) ??
    mapRoleValue(role.authority)
  );
}

function collectRoleValues(value: unknown): AppRole[] {
  if (!value) return [];

  if (typeof value === "string") {
    const mapped = mapRoleValue(value);
    return mapped ? [mapped] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap(collectRoleValues);
  }

  if (typeof value === "object") {
    const role = readRoleLike(value as RoleLike);
    return role ? [role] : [];
  }

  return [];
}

function getPrimaryRole(
  results: LoginResultsLike,
): AppRole {
  const jwtPayload = decodeJwtPayload(results.token);
  const mappedRoles = [
    ...collectRoleValues(results.roles),
    ...collectRoleValues(results.authorities),
    ...collectRoleValues(results.permissions),
    ...collectRoleValues(results.role),
    ...collectRoleValues(results.roleName),
    ...collectRoleValues(results.roleId),
    ...collectRoleValues(results.user?.roles),
    ...collectRoleValues(results.user?.authorities),
    ...collectRoleValues(results.user?.role),
    ...collectRoleValues(results.user?.roleName),
    ...collectRoleValues(results.user?.roleId),
    ...collectRoleValues(jwtPayload?.roles),
    ...collectRoleValues(jwtPayload?.authorities),
    ...collectRoleValues(jwtPayload?.scope),
    ...collectRoleValues(jwtPayload?.role),
    ...collectRoleValues(jwtPayload?.roleName),
    ...collectRoleValues(jwtPayload?.roleId),
  ];

  const priority: AppRole[] = ["admin", "staff", "scanner", "passenger"];
  return priority.find((role) => mappedRoles.includes(role)) ?? "passenger";
}

// ─── Login ────────────────────────────────────────────────────────────────────

export async function loginUser(data: LoginRequest): Promise<LoginResponse> {
  // MOCK MODE
  if (USE_MOCK_AUTH) {
    await new Promise((r) => setTimeout(r, 600));
    const account = MOCK_ACCOUNTS[data.email.toLowerCase()];
    if (!account || data.password.length < 6) {
      return {
        success: false,
        message:
          "Mock: Dùng admin@test.vn / staff@test.vn / passenger@test.vn / scanner@test.vn (mật khẩu ≥ 6 ký tự)",
      };
    }
    return {
      success: true,
      data: {
        token: "mock-token-dev",
        name: account.name,
        email: data.email,
        role: account.role,
      },
    };
  }

  // REAL API
  try {
    const res = await apiClient.post<LoginApiResponse>(
      API_ENDPOINTS.auth.login,
      data,
    );
    const results = res.data.results as LoginResultsLike;
    const jwtPayload = decodeJwtPayload(results.token);
    const tokenEmail =
      typeof jwtPayload?.sub === "string" ? jwtPayload.sub : undefined;
    const email = results.email ?? tokenEmail ?? data.email;
    return {
      success: true,
      data: {
        token: results.token,
        name: results.fullName ?? email,
        email,
        role: getPrimaryRole(results),
      },
    };
  } catch (error: unknown) {
    const err = error as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    const message =
      err.response?.data?.message || err.message || "Sai email hoặc mật khẩu.";
    return { success: false, message };
  }
}

// ─── Register ─────────────────────────────────────────────────────────────────

export async function registerUser(
  data: SignupRequest
): Promise<SignupResponse> {
  // MOCK MODE
  if (USE_MOCK_AUTH) {
    await new Promise((r) => setTimeout(r, 600));
    return { success: true };
  }

  // REAL API
  try {
    await apiClient.post<RegisterApiResponse>(API_ENDPOINTS.users.base, data);
    return { success: true };
  } catch (error: unknown) {
    const err = error as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    const message =
      err.response?.data?.message || err.message || "Đăng ký thất bại.";
    return { success: false, message };
  }
}

// ─── Check Email ──────────────────────────────────────────────────────────────
export async function checkEmailExists(
  _email: string
): Promise<CheckEmailResponse> {
  return { exists: false };
}

// ─── Introspect Token (FE-06) ─────────────────────────────────────────────────
// Gọi server để kiểm tra token còn hợp lệ không
export async function introspectToken(token: string): Promise<IntrospectResponse> {
  if (USE_MOCK_AUTH) return { valid: true };

  try {
    const res = await apiClient.post<{ code: number; results: IntrospectResponse }>(
      API_ENDPOINTS.auth.introspect,
      { token }
    );
    return res.data.results;
  } catch {
    return { valid: false };
  }
}

// ─── Refresh Token (FE-06) ────────────────────────────────────────────────────
// Dùng refreshToken cũ để lấy accessToken mới
export async function refreshAccessToken(refreshToken: string): Promise<RefreshResponse | null> {
  if (USE_MOCK_AUTH) return null;

  try {
    const res = await apiClient.post<{ code: number; results: RefreshResponse }>(
      API_ENDPOINTS.auth.refresh,
      { refreshToken }
    );
    return res.data.results;
  } catch {
    return null;
  }
}

// ─── Logout (FE-06) ──────────────────────────────────────────────────────────
// Báo server hủy token, xóa localStorage
export async function logoutUser(): Promise<void> {
  if (typeof window === "undefined") return;

  const token = localStorage.getItem("authToken");

  if (token && !USE_MOCK_AUTH) {
    try {
      await apiClient.post(API_ENDPOINTS.auth.logout, { token });
    } catch {
      // Dù server lỗi vẫn xóa local session
    }
  }

  localStorage.removeItem("authToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userRole");
  localStorage.removeItem("userName");
  sessionStorage.clear();
}
