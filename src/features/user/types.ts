export type Role = {
  roleId: string;
  roleName: string;
};

export type UserProfile = {
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  status: "ACTIVE" | "INACTIVE" | string;
  roles: Role[];
  address?: string;
  dob?: string;
};

export type ApiResponse<T> = {
  code: number;
  results: T;
};
