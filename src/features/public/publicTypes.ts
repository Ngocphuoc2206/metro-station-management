export type StationDto = {
  id: string;
  name: string;
  code?: string;
};

export type RouteDto = {
  id: string;
  name: string;
  description?: string;
  color?: string;
};

export type TicketTypeDto = {
  id: string;
  code?: string;
  name: string;
  conditions?: string;
  price?: number;
  status?: string;
  validityDuration?: number;
  validityUnit?: string;
};
