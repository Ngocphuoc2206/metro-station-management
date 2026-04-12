import { TicketType } from "./ticketTypeTypes";

let fakeTicketTypes: TicketType[] = [
  {
    id: "tt_1",
    code: "V-NGAY-01",
    name: "Vé ngày",
    validityDuration: 24,
    validityUnit: "hours",
    price: 35000,
    conditions: "Không giới hạn lượt đi trong 24 giờ",
    status: "active",
  },
  {
    id: "tt_2",
    code: "V-THG-30",
    name: "Vé tháng (Phổ thông)",
    validityDuration: 30,
    validityUnit: "days",
    price: 200000,
    conditions: "Sử dụng trong Zone 1, 2",
    status: "active",
  },
  {
    id: "tt_3",
    code: "V-STUD-30",
    name: "Vé tháng (Học sinh/SV)",
    validityDuration: 30,
    validityUnit: "days",
    price: 100000,
    conditions: "Yêu cầu thẻ HSSV hợp lệ",
    status: "active",
  },
  {
    id: "tt_4",
    code: "V-LOU-12",
    name: "Vé du lịch 3 ngày",
    validityDuration: 72,
    validityUnit: "hours",
    price: 90000,
    conditions: "Không giới hạn lượt đi, áp dụng ngày lễ",
    status: "inactive",
  },
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const ticketTypeApi = {
  getTicketTypes: async (): Promise<TicketType[]> => {
    await delay(600);
    return [...fakeTicketTypes];
  },

  createTicketType: async (data: Omit<TicketType, "id">): Promise<TicketType> => {
    await delay(800);
    const newRecord: TicketType = {
      ...data,
      id: `tt_${Date.now()}`,
    };
    fakeTicketTypes.push(newRecord);
    return newRecord;
  },

  updateTicketType: async (id: string, updates: Partial<TicketType>): Promise<TicketType> => {
    await delay(800);
    const index = fakeTicketTypes.findIndex((t) => t.id === id);
    if (index === -1) throw new Error("Not found");
    fakeTicketTypes[index] = { ...fakeTicketTypes[index], ...updates };
    return fakeTicketTypes[index];
  },

  deleteTicketType: async (id: string): Promise<void> => {
    await delay(800);
    fakeTicketTypes = fakeTicketTypes.filter((t) => t.id !== id);
  },
};
