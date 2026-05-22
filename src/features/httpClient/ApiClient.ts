import axios from "axios";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_API_ENDPOINT || "http://15.134.61.110:8080/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

function isLoginRequest(url?: string) {
  const path = url?.replace(/[?#].*$/, "").replace(/\/+$/, "");
  return path?.endsWith("/auth/login") ?? false;
}

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined" && !isLoginRequest(config.url)) {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    const sessionId = sessionStorage.getItem("sessionId");
    if (sessionId) {
      config.headers["X-Session-Id"] = sessionId;
    }
  }

  return config;
});
