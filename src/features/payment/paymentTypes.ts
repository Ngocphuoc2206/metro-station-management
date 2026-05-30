export type PaymentInitRequest = {
  orderId: string;
  method: string;
};

export type PaymentDto = {
  paymentId: string;
  amount?: number;
  clientSecret?: string;
  createdAt?: string;
  expiredAt?: string;
  method?: string;
  orderId?: string;
  paymentUrl?: string;
  provider?: string;
  providerTransactionId?: string;
  status?: string;
  orderStatus?: string;
};

export type PaymentCallbackRequest = {
  paymentId: string;
  transactionId: string;
  isSuccess: boolean;
};

export type PaymentInitResult = PaymentDto;
