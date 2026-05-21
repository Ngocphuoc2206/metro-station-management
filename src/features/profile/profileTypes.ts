export type MyProfileDto = {
  id?: string;
  email?: string;
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
  settings?: Record<string, unknown>;
};

export type UpdateMyProfileRequest = {
  fullName?: string;
  phone?: string;
};

export type UpdateMyPasswordRequest = {
  currentPassword: string;
  newPassword: string;
};

/**
 * Backend: NotificationSettingsRequest (PUT /api/v1/my/settings).
 * Field names are backend-owned; keep flexible to avoid FE breakage.
 */
export type UpdateMySettingsRequest = Record<string, unknown>;
