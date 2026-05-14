package com.backend.management_ticket_metro.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class TicketResponse {
    private String id;
    private String ticketCode;
    private String status;
    private LocalDateTime issuedAt;
    private LocalDateTime activatedAt;
    private LocalDateTime usedAt;
    private LocalDateTime expiredAt;
    private String orderId;
    private String orderItemId;
    private String fromStationId;
    private String toStationId;
}
