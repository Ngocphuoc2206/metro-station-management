import { apiClient } from "@features/httpClient/ApiClient";
import type {
  SignupRequest,
  SignupResponse,
  LoginRequest,
  LoginResponse,
  LoginApiResponse,
  RegisterApiResponse,
} from "./types";

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
  try {
    const res = await apiClient.post<LoginApiResponse>("/auth/login", data);
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
  try {
    await apiClient.post<RegisterApiResponse>("/users", data);
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
