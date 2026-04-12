import { FareMatrixData, Zone, FareRule } from "./fareTypes";

const initialZones: Zone[] = [
  { id: "z1", name: "Zone 1", order: 1 },
  { id: "z2", name: "Zone 2", order: 2 },
  { id: "z3", name: "Zone 3", order: 3 },
  { id: "z4", name: "Zone 4", order: 4 },
  { id: "z5", name: "Zone 5", order: 5 },
];

// Seed initial rules matching UI
const generateInitialRules = (): FareRule[] => {
  const rules: FareRule[] = [];
  const matrix: Record<string, number[]> = {
    "z1": [0, 15000, 20000, 25000, 30000],
    "z2": [15000, 0, 15000, 20000, 25000],
    "z3": [20000, 15000, 0, 15000, 20000],
    "z4": [25000, 20000, 15000, 0, 15000],
    "z5": [30000, 25000, 20000, 15000, 0],
  };

  initialZones.forEach((from, i) => {
    initialZones.forEach((to, j) => {
      rules.push({
        id: `rule-${from.id}-${to.id}`,
        fromZoneId: from.id,
        toZoneId: to.id,
        price: matrix[from.id][j],
      });
    });
  });
  return rules;
};

let fakeDb: FareMatrixData = {
  zones: initialZones,
  rules: generateInitialRules(),
  lastUpdated: "15/10/2024 14:22",
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const fareApi = {
  getFareMatrix: async (): Promise<FareMatrixData> => {
    await delay(700); // simulate network
    return { ...fakeDb };
  },

  updateFareMatrix: async (data: FareMatrixData): Promise<FareMatrixData> => {
    await delay(1200); // simulate slow save

    // Update timestamp
    const now = new Date();
    const formattedDate = `${now.getDate().toString().padStart(2, "0")}/${(now.getMonth() + 1).toString().padStart(2, "0")}/${now.getFullYear()} ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

    fakeDb = {
      ...data,
      lastUpdated: formattedDate,
    };

    return { ...fakeDb };
  },
};
