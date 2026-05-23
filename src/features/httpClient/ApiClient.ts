import axios from "axios";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_API_ENDPOINT || "http://15.134.61.110:8080/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Request interceptor: gắn token vào mọi request ───────────────────────────
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

// ── Response interceptor: tự động refresh token khi bị 401 (FE-06) ───────────
let isRefreshing = false;

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Nếu bị 401 và chưa retry lần nào
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Đang refresh rồi → logout luôn để tránh vòng lặp
        if (typeof window !== "undefined") {
          localStorage.clear();
          window.location.href = "/auth/login";
        }
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const storedRefreshToken = typeof window !== "undefined"
          ? localStorage.getItem("refreshToken")
          : null;

        if (storedRefreshToken) {
          const refreshRes = await axios.post(
            `${process.env.NEXT_PUBLIC_BASE_API_ENDPOINT || "http://15.134.61.110:8080/api/v1"}/auth/refresh`,
            { refreshToken: storedRefreshToken },
            { headers: { "Content-Type": "application/json" } }
          );

          const newToken = refreshRes.data?.results?.token;
          if (newToken) {
            localStorage.setItem("authToken", newToken);
            originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
            isRefreshing = false;
            return apiClient(originalRequest);
          }
        }
      } catch {
        // Refresh thất bại → xóa session và redirect về login
      }

      isRefreshing = false;
      if (typeof window !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = "/auth/login";
      }
    }

    return Promise.reject(error);
  }
);
