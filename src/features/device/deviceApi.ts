import { apiClient } from "@features/httpClient/ApiClient";
import { API_ENDPOINTS, ApiResponse, withPathParam } from "@features/httpClient/apiEndpoints";
import { unwrapApiResponse } from "@features/httpClient/unwrap";

// ── Types (Device) ────────────────────────────────────────────────────────────
export interface Device {
  id: string;
  name: string;
  type: string;
  status: "active" | "inactive" | "maintenance" | string;
  stationId?: string;
  stationName?: string;
  firmwareVersion?: string;
  lastPing?: string;
  config?: Record<string, unknown>;
}

// ── Backend response shape ────────────────────────────────────────────────────
interface BackendDevice {
  deviceId?: string;
  id?: string;
  deviceCode?: string;
  code?: string;
  name?: string;
  deviceName?: string;
  type?: string;
  deviceType?: string;
  status?: string;
  stationId?: string;
  stationName?: string;
  firmwareVersion?: string;
  lastPing?: string;
  lastHeartbeat?: string;
  config?: Record<string, unknown>;
  [key: string]: unknown;
}

function mapToUI(b: BackendDevice): Device {
  const rawStatus = b.status?.toLowerCase() ?? "inactive";
  const id = b.deviceId ?? b.id ?? b.deviceCode ?? b.code ?? "";
  const status = rawStatus.includes("maint")
    ? "maintenance"
    : rawStatus === "active" || rawStatus === "online"
    ? "active"
    : "inactive";

  return {
    id,
    name: b.name ?? b.deviceName ?? b.deviceCode ?? id,
    type: b.type ?? b.deviceType ?? "—",
    status,
    stationId: b.stationId,
    stationName: b.stationName,
    firmwareVersion: b.firmwareVersion,
    lastPing: b.lastPing ?? b.lastHeartbeat,
    config: b.config,
  };
}

export const deviceApi = {
  // ── GET /staff/devices (FE-34) ────────────────────────────────────────────
  getDevices: async (): Promise<Device[]> => {
    const res = await apiClient.get<ApiResponse<BackendDevice[]> | BackendDevice[]>(
      API_ENDPOINTS.devices.staff
    );
    const devices = unwrapApiResponse<BackendDevice[]>(res.data);
    return Array.isArray(devices)
      ? devices.map(mapToUI).filter((device) => device.id)
      : [];
  },

  // ── GET /staff/devices/{id} (FE-34) ───────────────────────────────────────
  getDeviceById: async (id: string): Promise<Device> => {
    const res = await apiClient.get<ApiResponse<BackendDevice>>(
      withPathParam(API_ENDPOINTS.devices.staff, id)
    );
    return mapToUI(res.data.results);
  },

  // ── POST /admin/devices (FE-34) ─────────────────────────────────────────
  createDevice: async (data: Partial<Device>): Promise<Device> => {
    const res = await apiClient.post<ApiResponse<BackendDevice>>(
      API_ENDPOINTS.devices.admin,
      data
    );
    return mapToUI(res.data.results);
  },

  // ── PATCH /admin/devices/{id}/status?status={status} (FE-34) ─────────────
  // BE nhận qua @RequestParam, không phải request body
  updateDeviceStatus: async (id: string, status: string): Promise<Device> => {
    const res = await apiClient.patch<ApiResponse<BackendDevice>>(
      `${withPathParam(API_ENDPOINTS.devices.admin, id)}/status?status=${status.toUpperCase()}`
    );
    return mapToUI(res.data.results);
  },
};
