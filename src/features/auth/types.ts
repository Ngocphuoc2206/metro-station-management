export type SignupRequest = {
  name: string;
  email: string;
  phone: string;
  password: string;
};

export type SignupResponse = {
  success: boolean;
  message?: string;
};

export type CheckEmailResponse = {
  exists: boolean;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  success: boolean;
  message?: string;
  data?: {
    name: string;
    email: string;
    role: "passenger" | "staff" | "admin";
  };
};
