import { apiClient } from "@features/httpClient/ApiClient";
import { API_ENDPOINTS, withPathParam } from "@features/httpClient/apiEndpoints";
import { unwrapApiResponse } from "@features/httpClient/unwrap";
import type {
  AdminDeviceRequest,
  AdminDeviceResponse,
  AdminDeviceStatus,
} from "./adminDeviceTypes";

type RawDevice = Partial<AdminDeviceResponse> & {
  deviceId?: string;
  deviceName?: string;
  code?: string;
  type?: string;
  deviceType?: string;
  firmwareVersion?: string;
  config?: Record<string, unknown>;
};

function normalizeDevice(raw: RawDevice): AdminDeviceResponse {
  return {
    id: raw.id ?? raw.deviceId ?? "",
    deviceCode: raw.deviceCode ?? raw.code ?? raw.id ?? raw.deviceId ?? "",
    name: raw.name ?? raw.deviceName ?? raw.deviceCode ?? raw.deviceId ?? "",
    ipAddress: raw.ipAddress,
    macAddress: raw.macAddress,
    status: raw.status ?? "OFFLINE",
    stationId: raw.stationId,
    stationName: raw.stationName,
    typeId: raw.typeId,
    typeName: raw.typeName ?? raw.type ?? raw.deviceType,
    lastMaintenance: raw.lastMaintenance,
    additionalDetails: raw.additionalDetails ?? raw.config,
  };
}

export const adminDeviceApi = {
  // The supplied Admin contract does not include GET; reuse the existing staff read endpoint.
  getDevices: async (): Promise<AdminDeviceResponse[]> => {
    const res = await apiClient.get(API_ENDPOINTS.devices.staff);
    const data = unwrapApiResponse<RawDevice[]>(res.data);
    return Array.isArray(data) ? data.map(normalizeDevice) : [];
  },

  createDevice: async (payload: AdminDeviceRequest): Promise<AdminDeviceResponse> => {
    const res = await apiClient.post(API_ENDPOINTS.devices.admin, payload);
    return normalizeDevice(unwrapApiResponse<RawDevice>(res.data));
  },

  updateDevice: async (
    id: string,
    payload: AdminDeviceRequest,
  ): Promise<AdminDeviceResponse> => {
    const res = await apiClient.put(withPathParam(API_ENDPOINTS.devices.admin, id), payload);
    return normalizeDevice(unwrapApiResponse<RawDevice>(res.data));
  },

  updateStatus: async (
    id: string,
    status: AdminDeviceStatus,
  ): Promise<AdminDeviceResponse> => {
    const res = await apiClient.patch(
      `${withPathParam(API_ENDPOINTS.devices.admin, id)}/status`,
      undefined,
      { params: { status } },
    );
    return normalizeDevice(unwrapApiResponse<RawDevice>(res.data));
  },
};

