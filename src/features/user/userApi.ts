import { apiClient } from "@features/httpClient/ApiClient";
import type { UserProfile, ApiResponse } from "./types";

/**
 * 1. API lấy profile hiện tại
 */
export async function getMyProfile(): Promise<UserProfile> {
  const res = await apiClient.get<ApiResponse<UserProfile>>("/users/my-profile");
  return res.data.results;
}

/**
 * 2. API cập nhật profile
 * Truyền các object cần update (ex: address, dob, fullName, phone)
 */
export async function updateMyProfile(data: Partial<UserProfile>): Promise<UserProfile> {
  const res = await apiClient.put<ApiResponse<UserProfile>>("/users/my-profile", data);
  return res.data.results;
}

/**
 * 3. API admin lấy danh sách user
 */
export async function getAllUsers(): Promise<UserProfile[]> {
  const res = await apiClient.get<ApiResponse<UserProfile[]>>("/users");
  return res.data.results;
}

/**
 * 4. API admin xem chi tiết user
 */
export async function getUserById(userId: string): Promise<UserProfile> {
  const res = await apiClient.get<ApiResponse<UserProfile>>(`/users/${userId}`);
  return res.data.results;
}

/**
 * 5. API admin khóa/mở user
 */
export async function updateUserStatus(userId: string, status: "ACTIVE" | "INACTIVE"): Promise<UserProfile> {
  const res = await apiClient.patch<ApiResponse<UserProfile>>(
    `/users/${userId}/status?status=${status}`
  );
  return res.data.results;
}
