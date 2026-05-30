export type LiveTrainDto = {
  id: string;
  code: string;
  routeId?: string;
  direction: string;
  nextStationId?: string;
  nextStationName: string;
  eta: string;
  occupancy: number;
  status: string;
  x?: number;
  y?: number;
};

export type LiveStationStatusDto = {
  id: string;
  stationId: string;
  name: string;
  status: string;
  congestionLevel?: number;
  message?: string;
  updatedAt?: string;
  x?: number;
  y?: number;
};
