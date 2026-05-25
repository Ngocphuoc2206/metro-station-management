export type OrderItemRequest = {
  ticketTypeId: string;
  quantity: number;
  fromStationId: string;
  toStationId: string;
};

export type OrderRequest = {
  items: OrderItemRequest[];
};

export type OrderPreviewRequest = OrderRequest;

export type OrderPreviewResult = {
  subtotal: number;
  serviceFee?: number;
  discount?: number;
  total: number;
  currency?: string;
  items?: unknown[];
};

export type CreateOrderRequest = OrderRequest;

export type OrderDto = {
  id: string;
  status?: string;
  total?: number;
  createdAt?: string;
  data?: unknown;
};
