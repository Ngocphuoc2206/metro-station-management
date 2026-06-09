import { apiClient } from "@features/httpClient/ApiClient";
import { API_ENDPOINTS, type ApiResponse } from "@features/httpClient/apiEndpoints";

// ────────────────────────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// ────────────────────────────────────────────────────────────────────────────

export interface DashboardSummary {
  totalRevenue: number;
  totalTicketsSold: number;
  totalTripsCompleted: number;
  activeIncidentsCount: number;
  totalErrorDevicesCount: number;
  ticketsByType: Record<string, number>;
}

export interface RevenueReport {
  date: string;
  revenue: number;
  orderCount: number;
}

export interface TicketSalesReport {
  date: string;
  ticketTypeName: string;
  quantitySold: number;
  amount: number;
}

export interface TripsReport {
  date: string;
  completedTrips: number;
  inProgressTrips: number;
  incompleteTrips: number;
}

export interface GateActivityReport {
  station: string;
  passengers: number;
}

export interface DeviceAlert {
  id: string;
  stationId: string;
  deviceId: string;
  message: string;
  severity: "critical" | "warning" | "info";
  timestamp: string;
}

// ────────────────────────────────────────────────────────────────────────────
// API SERVICE
// ────────────────────────────────────────────────────────────────────────────

export const reportApi = {
  // Get dashboard summary with optional parameters
  getDashboardSummary: async (params?: {
    range?: string;
    from?: string;
    to?: string;
    stationId?: string;
  }): Promise<DashboardSummary> => {
    const queryParams = new URLSearchParams();
    if (params?.range) queryParams.append("range", params.range);
    if (params?.from) queryParams.append("from", params.from);
    if (params?.to) queryParams.append("to", params.to);
    if (params?.stationId) queryParams.append("stationId", params.stationId);

    const url = `${API_ENDPOINTS.admin.dashboardSummary}${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;

    const res = await apiClient.get<ApiResponse<DashboardSummary>>(url);
    return res.data.results;
  },

  // Get revenue reports with time range
  getRevenueReport: async (range: "today" | "7d" | "30d" = "30d"): Promise<RevenueReport[]> => {
    const res = await apiClient.get<ApiResponse<RevenueReport[]>>(
      `${API_ENDPOINTS.admin.reports.revenue}?range=${range}`
    );
    return res.data.results ?? [];
  },

  // Get ticket sales report with time range
  getTicketSalesReport: async (range: "today" | "7d" | "30d" = "7d"): Promise<TicketSalesReport[]> => {
    const res = await apiClient.get<ApiResponse<TicketSalesReport[]>>(
      `${API_ENDPOINTS.admin.reports.ticketSales}?range=${range}`
    );
    return res.data.results ?? [];
  },

  // Get trips report with time range
  getTripsReport: async (range: "today" | "7d" | "30d" = "30d"): Promise<TripsReport[]> => {
    const res = await apiClient.get<ApiResponse<TripsReport[]>>(
      `${API_ENDPOINTS.admin.reports.trips}?range=${range}`
    );
    return res.data.results ?? [];
  },

  // Get gate activity report with time range
  getGateActivityReport: async (range: "today" | "7d" | "30d" = "today"): Promise<GateActivityReport[]> => {
    const res = await apiClient.get<ApiResponse<GateActivityReport[]>>(
      `${API_ENDPOINTS.admin.reports.gateActivity}?range=${range}`
    );
    return res.data.results ?? [];
  },

  // Get device alerts
  getDeviceAlerts: async (): Promise<DeviceAlert[]> => {
    const res = await apiClient.get<ApiResponse<DeviceAlert[]>>(
      API_ENDPOINTS.admin.reports.deviceAlerts
    );
    return res.data.results ?? [];
  },
};
