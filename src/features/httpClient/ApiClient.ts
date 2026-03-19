import axios from "axios";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_API_ENDPOINT,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const sessionId =
    typeof window !== "undefined"
      ? window.sessionStorage.getItem("sessionId")
      : null;

  if (sessionId) {
    config.headers["X-Session-Id"] = sessionId;
  }

  return config;
});
