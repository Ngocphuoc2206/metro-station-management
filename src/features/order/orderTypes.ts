export type OrderPreviewRequest = {
  fromStationId: string;
  toStationId: string;
  ticketTypeId: string;
  passengerCount?: number;
  isRoundTrip?: boolean;
  travelDate?: string;
  promotionCode?: string;
};

export type OrderPreviewResult = {
  subtotal: number;
  serviceFee?: number;
  discount?: number;
  total: number;
  currency?: string;
  items?: unknown[];
};

export type CreateOrderRequest = OrderPreviewRequest & {
  paymentMethod?: string;
};

export type OrderDto = {
  id: string;
  status?: string;
  total?: number;
  createdAt?: string;
  data?: unknown;
};
