package com.backend.management_ticket_metro.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class TicketUsageResponse {
    private String id;
    private String stationId;
    private String gateId;
    private Boolean success;
    private String message;
    private LocalDateTime scannedAt;
}
