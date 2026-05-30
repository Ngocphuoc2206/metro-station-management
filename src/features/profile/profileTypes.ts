export type MyProfileDto = {
  id?: string;
  email?: string;
  fullName?: string;
  phone?: string;
  address?: string;
  dob?: string;
  avatarUrl?: string;
  emailNotification?: boolean;
  smsNotification?: boolean;
  settings?: {
    emailNotification?: boolean;
    smsNotification?: boolean;
    [key: string]: unknown;
  };
};

export type UpdateMyProfileRequest = {
  fullName: string;
  phone: string;
  address: string;
  dob: string;
};

export type UpdateMyPasswordRequest = {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type UpdateMySettingsRequest = {
  emailNotification: boolean;
  smsNotification: boolean;
};
