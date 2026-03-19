export type RequestProtocol = {
  url: string;
  methodType: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  data?: unknown;
  params?: Record<string, unknown>;
};
