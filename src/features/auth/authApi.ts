import { apiClient } from "@features/httpClient/ApiClient";
import type {
  SignupRequest,
  SignupResponse,
  CheckEmailResponse,
  LoginRequest,
  LoginResponse,
} from "./types";

export async function registerUser(data: SignupRequest): Promise<SignupResponse> {
  const response = await apiClient.post<SignupResponse>("/auth/register", data);
  return response.data;
}

export async function checkEmailExists(email: string): Promise<CheckEmailResponse> {
  const response = await apiClient.get<CheckEmailResponse>("/auth/check-email", {
    params: { email },
  });
  return response.data;
}

export async function loginUser(data: LoginRequest): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>("/auth/login", data);
  return response.data;
}
