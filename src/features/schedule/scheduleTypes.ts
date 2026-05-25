export type ScheduleDto = {
  id: string;
  routeId: string;
  stationId: string;
  direction: string;
  departureTime: string;
  arrivalTime: string;
  frequencyMinutes: number;
  status: string;
};
