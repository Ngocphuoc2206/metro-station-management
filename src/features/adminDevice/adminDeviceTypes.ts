export type AdminDeviceStatus = "ONLINE" | "OFFLINE" | "MAINTENANCE";

export type DeviceDetailKind = "GATE" | "TICKET_MACHINE" | "SCANNER";

export interface AdminDeviceRequest {
  deviceCode: string;
  name: string;
  ipAddress?: string;
  macAddress?: string;
  stationId: string;
  typeId: string;
  status: AdminDeviceStatus;
  lastMaintenance?: string;
  directionMode?: string;
  gateType?: string;
  emergencyMode?: boolean;
  passageCount?: number;
  cardStockLevel?: number;
  acceptedPaymentMethods?: string;
  cashBoxFull?: boolean;
  printerInkLevel?: number;
  batteryLevel?: number;
  osVersion?: string;
  assignedStaffId?: string;
}

export interface AdminDeviceResponse {
  id: string;
  deviceCode: string;
  name: string;
  ipAddress?: string;
  macAddress?: string;
  status: string;
  stationId?: string;
  stationName?: string;
  typeId?: string;
  typeName?: string;
  lastMaintenance?: string;
  additionalDetails?: Record<string, unknown>;
}
