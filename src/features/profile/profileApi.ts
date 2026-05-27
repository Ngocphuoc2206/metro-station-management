import { apiClient } from "@features/httpClient/ApiClient";
import { API_ENDPOINTS } from "@features/httpClient/apiEndpoints";
import { unwrapApiResponse } from "@features/httpClient/unwrap";
import type {
  MyProfileDto,
  UpdateMyPasswordRequest,
  UpdateMyProfileRequest,
  UpdateMySettingsRequest,
} from "./profileTypes";

export const PROFILE_UPDATED_EVENT = "passenger-profile-updated";

export const notifyProfileUpdated = (profile: MyProfileDto) => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent<MyProfileDto>(PROFILE_UPDATED_EVENT, { detail: profile }),
    );
  }
};

export const profileApi = {
  getMyProfile: async (): Promise<MyProfileDto> => {
    const res = await apiClient.get(API_ENDPOINTS.my.profile);
    return unwrapApiResponse<MyProfileDto>(res.data);
  },

  updateMyProfile: async (payload: UpdateMyProfileRequest): Promise<MyProfileDto> => {
    const res = await apiClient.put(API_ENDPOINTS.my.profile, payload);
    return unwrapApiResponse<MyProfileDto>(res.data);
  },

  updateMyPassword: async (payload: UpdateMyPasswordRequest): Promise<unknown> => {
    const res = await apiClient.put(API_ENDPOINTS.my.password, payload);
    return unwrapApiResponse(res.data);
  },

  updateMySettings: async (payload: UpdateMySettingsRequest): Promise<MyProfileDto> => {
    const res = await apiClient.put(API_ENDPOINTS.my.settings, payload);
    return unwrapApiResponse<MyProfileDto>(res.data);
  },

  uploadAvatar: async (file: File): Promise<unknown> => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await apiClient.post(API_ENDPOINTS.my.avatar, formData);

    return unwrapApiResponse(res.data);
  },
};
