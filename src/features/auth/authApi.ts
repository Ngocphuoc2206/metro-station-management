// ─── MOCK MODE ────────────────────────────────────────────────────────────────
// TODO: Khi kết nối API thật, xoá phần mock bên dưới và dùng lại phần real API
// đã được comment out ở cuối file.

import type {
  SignupRequest,
  SignupResponse,
  CheckEmailResponse,
  LoginRequest,
  LoginResponse,
} from "./types";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Mock accounts — email prefix xác định role
const MOCK_ACCOUNTS: Record<string, { name: string; role: "admin" | "staff" | "passenger" }> = {
  admin: { name: "Admin User", role: "admin" },
  staff: { name: "Nguyễn Nhân Viên", role: "staff" },
  passenger: { name: "Trần Hành Khách", role: "passenger" },
};

export async function loginUser(data: LoginRequest): Promise<LoginResponse> {
  await delay(800); // giả lập network
  const prefix = data.email.split("@")[0].toLowerCase();
  const account = MOCK_ACCOUNTS[prefix];
  if (!account || data.password.length < 6) {
    return {
      success: false,
      message: "Sai email hoặc mật khẩu. Dùng admin@test.vn / staff@test.vn / passenger@test.vn",
    };
  }
  return {
    success: true,
    data: { name: account.name, email: data.email, role: account.role },
  };
}

export async function registerUser(_data: SignupRequest): Promise<SignupResponse> {
  await delay(600);
  return { success: true, message: "Đăng ký thành công (mock)" };
}

export async function checkEmailExists(_email: string): Promise<CheckEmailResponse> {
  await delay(300);
  return { exists: false };
}

// ─── REAL API (uncomment khi có backend) ──────────────────────────────────────
// import { apiClient } from "@features/httpClient/ApiClient";
//
// export async function loginUser(data: LoginRequest): Promise<LoginResponse> {
//   const response = await apiClient.post<LoginResponse>("/auth/login", data);
//   return response.data;
// }
// export async function registerUser(data: SignupRequest): Promise<SignupResponse> {
//   const response = await apiClient.post<SignupResponse>("/auth/register", data);
//   return response.data;
// }
// export async function checkEmailExists(email: string): Promise<CheckEmailResponse> {
//   const response = await apiClient.get<CheckEmailResponse>("/auth/check-email", { params: { email } });
//   return response.data;
// }
