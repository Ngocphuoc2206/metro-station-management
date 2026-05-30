export type TripQuery = {
  page: number;
  limit: number;
  from?: string;
  to?: string;
  stationId?: string;
};

export type TripDto = {
  id: string;
  ticketId: string;
  ticketCode: string;
  originStationName: string;
  destinationStationName: string;
  checkInAt?: string;
  checkOutAt?: string;
  status: string;
  fare?: number;
  entryGate?: string;
  exitGate?: string;
};

export type TripPage = {
  items: TripDto[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
