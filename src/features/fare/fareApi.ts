import { apiClient } from "@features/httpClient/ApiClient";
import { API_ENDPOINTS, ApiResponse, withPathParam } from "@features/httpClient/apiEndpoints";
import { FareMatrixData, FareRule, Zone } from "./fareTypes";

// ── Backend response shape ────────────────────────────────────────────────────
interface BackendFare {
  fareId: string;
  fromStationId?: string;
  toStationId?: string;
  fromZoneId?: string;
  toZoneId?: string;
  price: number;
  amount?: number;
  updatedAt?: string;
  [key: string]: unknown;
}

// ── Map Backend → UI ──────────────────────────────────────────────────────────
function mapToFareMatrix(fares: BackendFare[]): FareMatrixData {
  // Trích xuất zone IDs duy nhất từ danh sách fares
  const zoneSet = new Set<string>();
  fares.forEach((f) => {
    if (f.fromZoneId) zoneSet.add(f.fromZoneId);
    if (f.toZoneId) zoneSet.add(f.toZoneId);
  });

  const zones: Zone[] = Array.from(zoneSet)
    .sort()
    .map((id, i) => ({ id, name: `Zone ${i + 1}`, order: i + 1 }));

  const rules: FareRule[] = fares.map((f) => ({
    id: f.fareId,
    fromZoneId: f.fromZoneId ?? f.fromStationId ?? "",
    toZoneId: f.toZoneId ?? f.toStationId ?? "",
    price: f.price ?? f.amount ?? 0,
  }));

  const lastEntry = fares[0];
  const lastUpdated = lastEntry?.updatedAt
    ? new Date(lastEntry.updatedAt as string).toLocaleString("vi-VN")
    : new Date().toLocaleString("vi-VN");

  return { zones, rules, lastUpdated };
}

export const fareApi = {
  // ── GET fares (FE-20) — Dùng GET /fares/calculate để lấy toàn bộ ──────────
  getFareMatrix: async (): Promise<FareMatrixData> => {
    try {
      const res = await apiClient.get<ApiResponse<BackendFare[]>>(
        API_ENDPOINTS.fares.calculate
      );
      return mapToFareMatrix(res.data.results ?? []);
    } catch {
      // Fallback nếu API chưa sẵn sàng
      return { zones: [], rules: [], lastUpdated: "—" };
    }
  },

  // ── POST /admin/fares (FE-20) ─────────────────────────────────────────────
  createFare: async (data: Omit<FareRule, "id">): Promise<FareRule> => {
    const res = await apiClient.post<ApiResponse<BackendFare>>(
      API_ENDPOINTS.fares.admin,
      {
        fromZoneId: data.fromZoneId,
        toZoneId: data.toZoneId,
        price: data.price,
      }
    );
    return {
      id: res.data.results.fareId,
      fromZoneId: data.fromZoneId,
      toZoneId: data.toZoneId,
      price: res.data.results.price,
    };
  },

  // ── PUT /admin/fares/{id} (FE-20) ─────────────────────────────────────────
  updateFare: async (id: string, price: number): Promise<FareRule> => {
    const res = await apiClient.put<ApiResponse<BackendFare>>(
      withPathParam(API_ENDPOINTS.fares.admin, id),
      { price }
    );
    const b = res.data.results;
    return {
      id: b.fareId,
      fromZoneId: b.fromZoneId ?? "",
      toZoneId: b.toZoneId ?? "",
      price: b.price,
    };
  },

  // ── Legacy: updateFareMatrix (gọi nhiều PUT liên tiếp) ────────────────────
  updateFareMatrix: async (data: FareMatrixData): Promise<FareMatrixData> => {
    await Promise.all(
      data.rules.map((rule) =>
        apiClient
          .put<ApiResponse<BackendFare>>(
            withPathParam(API_ENDPOINTS.fares.admin, rule.id),
            { price: rule.price }
          )
          .catch(() => null) // Bỏ qua lỗi từng rule, tiếp tục update
      )
    );

    return {
      ...data,
      lastUpdated: new Date().toLocaleString("vi-VN"),
    };
  },
};
