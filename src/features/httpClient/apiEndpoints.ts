const endpoint = (value: string | undefined, fallback: string) =>
  value && value.trim() ? value : fallback;

export const API_ENDPOINTS = {
  auth: {
    login: endpoint(process.env.NEXT_PUBLIC_AUTH_LOGIN_ENDPOINT, "/auth/login"),
    introspect: endpoint(
      process.env.NEXT_PUBLIC_AUTH_INTROSPECT_ENDPOINT,
      "/auth/introspect",
    ),
    refresh: endpoint(process.env.NEXT_PUBLIC_AUTH_REFRESH_ENDPOINT, "/auth/refresh"),
    logout: endpoint(process.env.NEXT_PUBLIC_AUTH_LOGOUT_ENDPOINT, "/auth/logout"),
  },
  users: {
    base: endpoint(process.env.NEXT_PUBLIC_USERS_ENDPOINT, "/users"),
    me: endpoint(process.env.NEXT_PUBLIC_USER_ME_ENDPOINT, "/users/me"),
  },
  my: {
    profile: endpoint(process.env.NEXT_PUBLIC_MY_PROFILE_ENDPOINT, "/my/profile"),
    password: endpoint(process.env.NEXT_PUBLIC_MY_PASSWORD_ENDPOINT, "/my/password"),
    settings: endpoint(process.env.NEXT_PUBLIC_MY_SETTINGS_ENDPOINT, "/my/settings"),
    avatar: endpoint(process.env.NEXT_PUBLIC_MY_AVATAR_ENDPOINT, "/my/avatar"),
    tickets: endpoint(process.env.NEXT_PUBLIC_MY_TICKETS_ENDPOINT, "/my/tickets"),
  },
  devices: {
    admin: endpoint(process.env.NEXT_PUBLIC_ADMIN_DEVICES_ENDPOINT, "/admin/devices"),
    staff: endpoint(process.env.NEXT_PUBLIC_STAFF_DEVICES_ENDPOINT, "/staff/devices"),
  },
  incidents: {
    staff: endpoint(process.env.NEXT_PUBLIC_STAFF_INCIDENTS_ENDPOINT, "/staff/incidents"),
  },
  shifts: {
    staff: endpoint(process.env.NEXT_PUBLIC_STAFF_SHIFTS_ENDPOINT, "/staff/shifts"),
  },
  gates: {
    staff: endpoint(process.env.NEXT_PUBLIC_STAFF_GATES_ENDPOINT, "/staff/gates"),
    scan: endpoint(process.env.NEXT_PUBLIC_STAFF_GATE_SCAN_ENDPOINT, "/staff/gates/scan"),
    logs: endpoint(process.env.NEXT_PUBLIC_STAFF_GATE_LOGS_ENDPOINT, "/staff/gates/logs"),
  },
  routes: {
    base: endpoint(process.env.NEXT_PUBLIC_ROUTES_ENDPOINT, "/routes"),
    admin: endpoint(process.env.NEXT_PUBLIC_ADMIN_ROUTES_ENDPOINT, "/routes/admin"),
  },
  stations: {
    base: endpoint(process.env.NEXT_PUBLIC_STATIONS_ENDPOINT, "/stations"),
    admin: endpoint(process.env.NEXT_PUBLIC_ADMIN_STATIONS_ENDPOINT, "/admin/stations"),
  },
  fares: {
    calculate: endpoint(
      process.env.NEXT_PUBLIC_FARE_CALCULATE_ENDPOINT,
      "/fares/calculate",
    ),
    admin: endpoint(process.env.NEXT_PUBLIC_ADMIN_FARES_ENDPOINT, "/admin/fares"),
  },
  ticketTypes: {
    base: endpoint(process.env.NEXT_PUBLIC_TICKET_TYPES_ENDPOINT, "/ticket-types"),
    admin: endpoint(
      process.env.NEXT_PUBLIC_ADMIN_TICKET_TYPES_ENDPOINT,
      "/admin/ticket-types",
    ),
  },
  orders: {
    base: endpoint(process.env.NEXT_PUBLIC_ORDERS_ENDPOINT, "/orders"),
    preview: endpoint(process.env.NEXT_PUBLIC_ORDER_PREVIEW_ENDPOINT, "/orders/preview"),
    status: endpoint(process.env.NEXT_PUBLIC_ORDER_STATUS_ENDPOINT, "/orders/status"),
  },
  payments: {
    base: endpoint(process.env.NEXT_PUBLIC_PAYMENTS_ENDPOINT, "/payments"),
    init: endpoint(process.env.NEXT_PUBLIC_PAYMENT_INIT_ENDPOINT, "/payments/init"),
    callback: endpoint(
      process.env.NEXT_PUBLIC_PAYMENT_CALLBACK_ENDPOINT,
      "/payments/callback",
    ),
  },
  permissions: {
    matrix: endpoint(
      process.env.NEXT_PUBLIC_PERMISSIONS_MATRIX_ENDPOINT,
      "/permissions/matrix",
    ),
    roles: endpoint(
      process.env.NEXT_PUBLIC_PERMISSION_ROLES_ENDPOINT,
      "/permissions/roles",
    ),
  },
  media: {
    upload: endpoint(process.env.NEXT_PUBLIC_MEDIA_UPLOAD_ENDPOINT, "/media/upload"),
  },
};

export type ApiResponse<T> = {
  code: number;
  message?: string;
  results: T;
};

export const withPathParam = (path: string, value: string | number) =>
  `${path.replace(/\/$/, "")}/${encodeURIComponent(String(value))}`;
