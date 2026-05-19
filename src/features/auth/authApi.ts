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

// ─── Flag môi trường ──────────────────────────────────────────────────────────
// Đặt NEXT_PUBLIC_USE_MOCK_AUTH=true trong .env.local khi backend chưa chạy
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === "true";

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
function mapRole(
  roleName: string
): "passenger" | "staff" | "admin" | "scanner" {
  const map: Record<string, "passenger" | "staff" | "admin" | "scanner"> = {
    ROLE_PASSENGER: "passenger",
    PASSENGER: "passenger",
    ROLE_STAFF: "staff",
    STAFF: "staff",
    ROLE_ADMIN: "admin",
    ADMIN: "admin",
    ROLE_SCANNER: "scanner",
    SCANNER: "scanner",
  };
  return map[roleName?.toUpperCase()] ?? "passenger";
}

// ─── Login ────────────────────────────────────────────────────────────────────

export async function loginUser(data: LoginRequest): Promise<LoginResponse> {
  // MOCK MODE
  if (USE_MOCK) {
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
    const { results } = res.data;
    const primaryRole = results.roles?.[0]?.roleName ?? "ROLE_PASSENGER";
    return {
      success: true,
      data: {
        token: results.token,
        name: results.fullName,
        email: results.email,
        role: mapRole(primaryRole),
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
  if (USE_MOCK) {
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
