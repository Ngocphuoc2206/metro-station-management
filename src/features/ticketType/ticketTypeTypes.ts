export interface TicketType {
  id: string;
  code: string; // V-NGAY-01
  name: string; // Vé ngày
  validityDuration: number; // 24
  validityUnit: "hours" | "days"; // giờ / ngày
  price: number; // 35000
  conditions: string; // Không giới hạn lượt đi
  status: "active" | "inactive"; // Hoạt động / Ngừng áp dụng
}
