package com.backend.management_ticket_metro.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponse {
    private double amount;
    private String clientSecret;
    private LocalDateTime createdAt;
    private LocalDateTime expiredAt;
    private String method;
    private String orderId;
    private String paymentId;
    private String paymentUrl;
    private String provider;
    private String providerTransactionId;
    private String status;
    private String orderStatus;
}
