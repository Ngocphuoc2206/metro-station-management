import type { ApiResponse } from "./apiEndpoints";

export function unwrapApiResponse<T>(data: ApiResponse<T> | T): T {
  if (data && typeof data === "object" && "results" in (data as ApiResponse<T>)) {
    return (data as ApiResponse<T>).results;
  }

  return data as T;
}
