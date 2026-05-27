import { apiClient } from "@features/httpClient/ApiClient";
import { API_ENDPOINTS, ApiResponse, withPathParam } from "@features/httpClient/apiEndpoints";

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
  deviceId: string;
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
  const status = rawStatus.includes("active")
    ? "active"
    : rawStatus.includes("maint")
    ? "maintenance"
    : "inactive";

  return {
    id: b.deviceId,
    name: b.name ?? b.deviceName ?? b.deviceId,
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
    const res = await apiClient.get<ApiResponse<BackendDevice[]>>(
      API_ENDPOINTS.devices.staff
    );
    return (res.data.results ?? []).map(mapToUI);
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
