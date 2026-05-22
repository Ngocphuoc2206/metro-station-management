export type PaymentInitRequest = {
  orderId: string;
  method: string;
  returnUrl?: string;
};

export type PaymentInitResult = {
  id: string;
  status?: string;
  redirectUrl?: string;
  checkoutUrl?: string;
};

export type PaymentDto = {
  id: string;
  status?: string;
  orderId?: string;
  data?: unknown;
};
