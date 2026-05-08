package com.backend.management_ticket_metro.dto.request;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentInitRequest {
    private String orderId;
    private String method;
}
