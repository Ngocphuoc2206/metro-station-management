export type StationDto = {
  id: string;
  name: string;
  code?: string;
  latitude?: number;
  longitude?: number;
};

export type RouteDto = {
  id: string;
  name: string;
  description?: string;
  color?: string;
};

export type TicketTypeDto = {
  id: string;
  name: string;
  description?: string;
  price?: number;
  validityDays?: number;
  isActive?: boolean;

  // Legacy response aliases retained for screens still using the older schema.
  code?: string;
  conditions?: string;
  status?: string;
  validityDuration?: number;
  validityUnit?: string;
};
