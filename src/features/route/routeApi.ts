import { Route } from "./routeTypes";

let fakeRoutes: Route[] = [
  {
    id: "r1",
    name: "Line 01 - Metro Blue",
    description: "Bến Thành - Suối Tiên",
    color: "#3b82f6", // blue-500
    status: "active",
    stationsCount: 14,
    startTime: "05:00 AM",
    endTime: "11:30 PM",
    headwayMinutes: 5,
    stations: [
      { id: "rs1", stationId: "sta1", stationName: "Ga Bến Thành", stationDetail: "Ga trung tâm / Kết nối Line 01, 02, 03", sequenceOrder: 1 },
      { id: "rs2", stationId: "sta2", stationName: "Ga Nhà hát Thành phố", stationDetail: "Ga ngầm / Quận 1", sequenceOrder: 2 },
      { id: "rs3", stationId: "sta3", stationName: "Ga Ba Son", stationDetail: "Ga ngầm / Quận 1", sequenceOrder: 3 },
    ],
  },
  {
    id: "r2",
    name: "Line 02 - Metro Green",
    description: "Bến Thành - Tham Lương",
    color: "#22c55e", // green-500
    status: "inactive",
    stationsCount: 11,
    startTime: "05:30 AM",
    endTime: "11:00 PM",
    headwayMinutes: 8,
    stations: [
      { id: "rs4", stationId: "sta1", stationName: "Ga Bến Thành", stationDetail: "Ga trung tâm / Kết nối Line 01, 02, 03", sequenceOrder: 1 },
      { id: "rs5", stationId: "sta4", stationName: "Ga Tao Đàn", stationDetail: "Ga ngầm / Quận 1", sequenceOrder: 2 },
    ],
  },
  {
    id: "r3",
    name: "Line 03a - South West",
    description: "Bến Thành - Tân Kiên",
    color: "#ef4444", // red-500
    status: "maintenance",
    stationsCount: 18,
    startTime: "06:00 AM",
    endTime: "10:30 PM",
    headwayMinutes: 10,
    stations: [],
  },
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const routeApi = {
  getRoutes: async (): Promise<Route[]> => {
    await delay(600);
    return [...fakeRoutes];
  },

  createRoute: async (data: Omit<Route, "id" | "stationsCount" | "stations">): Promise<Route> => {
    await delay(800);
    const newRoute: Route = {
      ...data,
      id: `r${Date.now()}`,
      stationsCount: 0,
      stations: [],
    };
    fakeRoutes.push(newRoute);
    return newRoute;
  },

  updateRoute: async (id: string, updates: Partial<Route>): Promise<Route> => {
    await delay(800);
    const index = fakeRoutes.findIndex((r) => r.id === id);
    if (index === -1) throw new Error("Route not found");
    
    fakeRoutes[index] = { ...fakeRoutes[index], ...updates };
    return fakeRoutes[index];
  },
};
