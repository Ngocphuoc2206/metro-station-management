import { apiClient } from "@features/httpClient/ApiClient";
import { API_ENDPOINTS, withPathParam } from "@features/httpClient/apiEndpoints";
import { unwrapApiResponse } from "@features/httpClient/unwrap";
import type {
  AdminDeviceRequest,
  AdminDeviceResponse,
  AdminDeviceStatus,
  AdminDeviceTypeOption,
} from "./adminDeviceTypes";
import type { GateResponse } from "@features/staffGate/staffGateTypes";

type RawDevice = Partial<AdminDeviceResponse> & {
  deviceId?: string;
  deviceName?: string;
  code?: string;
  type?: string;
  deviceType?: string;
  firmwareVersion?: string;
  config?: Record<string, unknown>;
};

type RawDeviceType = {
  id?: string;
  typeId?: string;
  typeName?: string;
  name?: string;
  description?: string;
};

type RawGate = Partial<GateResponse> & {
  id?: string;
  code?: string;
};

function normalizeDevice(raw: RawDevice): AdminDeviceResponse {
  return {
    id: raw.id ?? raw.deviceId ?? "",
    deviceCode: raw.deviceCode ?? raw.code ?? raw.id ?? raw.deviceId ?? "",
    name: raw.name ?? raw.deviceName ?? raw.deviceCode ?? raw.deviceId ?? "",
    ipAddress: raw.ipAddress,
    macAddress: raw.macAddress,
    status: raw.status ?? "INACTIVE",
    stationId: raw.stationId,
    stationName: raw.stationName,
    gateId: raw.gateId,
    gateName: raw.gateName,
    typeId: raw.typeId,
    typeName: raw.typeName ?? raw.type ?? raw.deviceType,
    lastMaintenance: raw.lastMaintenance,
    additionalDetails: raw.additionalDetails ?? raw.config,
  };
}

function normalizeDeviceType(raw: RawDeviceType): AdminDeviceTypeOption {
  const id = raw.id ?? raw.typeId ?? "";
  return {
    id,
    name: raw.typeName ?? raw.name ?? id,
  };
}

function normalizeGate(raw: RawGate): GateResponse {
  const gateId = raw.gateId ?? raw.id ?? "";
  const gateCode = raw.gateCode ?? raw.code ?? gateId;

  return {
    gateId,
    gateCode,
    name: raw.name ?? gateCode,
    stationId: raw.stationId ?? "",
    stationName: raw.stationName ?? "",
    action: raw.action ?? "",
    status: raw.status ?? "",
    deviceId: raw.deviceId,
    deviceCode: raw.deviceCode,
    type: raw.type,
    deviceType: raw.deviceType,
    directionMode: raw.directionMode,
  };
}

async function getDeviceList(endpoint: string) {
  const res = await apiClient.get(endpoint);
  const data = unwrapApiResponse<RawDevice[]>(res.data);
  return Array.isArray(data) ? data.map(normalizeDevice) : [];
}

export const adminDeviceApi = {
  getDevices: async (): Promise<AdminDeviceResponse[]> => {
    return getDeviceList(API_ENDPOINTS.devices.staff);
  },

  createDevice: async (payload: AdminDeviceRequest): Promise<AdminDeviceResponse> => {
    const res = await apiClient.post(API_ENDPOINTS.devices.admin, payload);
    return normalizeDevice(unwrapApiResponse<RawDevice>(res.data));
  },

  getDeviceTypes: async (): Promise<AdminDeviceTypeOption[]> => {
    const res = await apiClient.get(API_ENDPOINTS.devices.types);
    const data = unwrapApiResponse<RawDeviceType[]>(res.data);
    return Array.isArray(data) ? data.map(normalizeDeviceType).filter((type) => type.id) : [];
  },

  getGatesByStation: async (stationId: string): Promise<GateResponse[]> => {
    const res = await apiClient.get(API_ENDPOINTS.gates.staff, { params: { stationId } });
    const data = unwrapApiResponse<RawGate[]>(res.data);
    return Array.isArray(data) ? data.map(normalizeGate).filter((gate) => gate.gateId) : [];
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
