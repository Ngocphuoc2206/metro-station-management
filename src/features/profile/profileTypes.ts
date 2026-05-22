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

export type UpdateMySettingsRequest = Record<string, unknown>;
