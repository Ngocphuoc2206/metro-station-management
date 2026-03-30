import { User } from "./userTypes";

let fakeUsers: User[] = [
  {
    id: "u_1",
    name: "Nguyễn Văn A",
    email: "admin@metronext.vn",
    role: "admin",
    status: "active",
    lastLogin: "08:15, 24/10/2024",
    assignedStationName: "Toàn hệ thống",
  },
  {
    id: "u_2",
    name: "Trần Minh",
    email: "tranminh.staff@metronext.vn",
    role: "staff",
    status: "active",
    lastLogin: "Vừa xong",
    assignedStationId: "sta1",
    assignedStationName: "Ga Bến Thành",
  },
  {
    id: "u_3",
    name: "Lê Hoa",
    email: "lehoa.passenger@gmail.com",
    role: "passenger",
    status: "inactive",
    lastLogin: "3 ngày trước",
  },
  {
    id: "u_4",
    name: "Phạm Quét",
    email: "pham.scanner@metronext.vn",
    role: "scanner",
    status: "active",
    lastLogin: "Hôm qua",
    assignedStationId: "sta2",
    assignedStationName: "Ga Nhà Hát",
  },
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const userApi = {
  getUsers: async (): Promise<User[]> => {
    await delay(600);
    return [...fakeUsers];
  },

  createUser: async (data: Omit<User, "id">): Promise<User> => {
    await delay(800);
    const newUser: User = {
      ...data,
      id: `u_${Date.now()}`,
      lastLogin: "Chưa đăng nhập",
    };
    fakeUsers.push(newUser);
    return newUser;
  },

  updateUser: async (id: string, updates: Partial<User>): Promise<User> => {
    await delay(800);
    const index = fakeUsers.findIndex((u) => u.id === id);
    if (index === -1) throw new Error("Not found");
    
    // Nếu chuyển role không phải staff/scanner thì xóa trạm gán
    if (updates.role && ["admin", "passenger"].includes(updates.role)) {
      updates.assignedStationId = undefined;
      updates.assignedStationName = updates.role === "admin" ? "Toàn hệ thống" : undefined;
    }
    
    fakeUsers[index] = { ...fakeUsers[index], ...updates };
    return fakeUsers[index];
  },

  deleteUser: async (id: string): Promise<void> => {
    await delay(800);
    fakeUsers = fakeUsers.filter((u) => u.id !== id);
  },
};
