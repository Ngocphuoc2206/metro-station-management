package com.backend.management_ticket_metro.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class TicketQrTokenResponse {
    private String ticketId;
    private String qrToken;
    private String qrContent;
    private String qrCodeUrl;
    private LocalDateTime expiresAt;
    private Long ttlSeconds;
}
