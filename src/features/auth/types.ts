// ─── Register ────────────────────────────────────────────────────────────────

export type SignupRequest = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

export type RegisterApiResponse = {
  code: number;
  results: {
    userId: string;
    fullName: string;
    email: string;
    phone: string;
    status: string;
    roles: { roleId: string; roleName: string }[];
  };
};

export type SignupResponse = {
  success: boolean;
  message?: string;
};

export type CheckEmailResponse = {
  exists: boolean;
  message?: string;
};

// ─── Login ───────────────────────────────────────────────────────────────────

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginApiResponse = {
  code: number;
  results: {
    authenticated?: boolean;
    token: string;
    userId?: string;
    fullName?: string;
    email?: string;
    roles?: { roleId: string; roleName: string }[];
  };
};

export type LoginResponse = {
  success: boolean;
  message?: string;
  data?: {
    token: string;
    name: string;
    email: string;
    role: "passenger" | "staff" | "admin" | "scanner";
  };
};

