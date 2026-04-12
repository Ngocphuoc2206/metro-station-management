export type StationStatus = "active" | "inactive";

export interface Station {
  id: string; // UUID from ERD, but maybe formatted as "STA-001" for display
  code: string; // E.g., STA-001
  name: string; // Tên ga
  line: string; // Tuyến (Mock field required by UI)
  zone: string; // Khu vực / Quận (Mock field req by UI)
  status: StationStatus; // Hoạt động / Tạm ngưng
  location: string; // From ERD, lat/long or address string
}

export interface StationFilters {
  search?: string;
  line?: string;
  status?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
