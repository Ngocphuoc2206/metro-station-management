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
 * Fields based on backend DTO.
 */
export type UpdateMySettingsRequest = {
  emailNotification?: boolean;
  smsNotification?: boolean;
};
