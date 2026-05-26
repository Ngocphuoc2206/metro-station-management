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

// UI pricing model normalized from BE OrderResponse.totalAmount and item unit prices.
export type OrderPreviewResult = {
  subtotal: number;
  serviceFee: number;
  discount?: number;
  total: number;
  currency?: string;
  items?: unknown[];
};

export type CreateOrderRequest = OrderRequest;

export type OrderDto = {
  id: string;
  orderId?: string;
  status?: string;
  total?: number;
  totalAmount?: number;
  createdAt?: string;
  items?: unknown[];
  data?: unknown;
};
