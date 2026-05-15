package com.backend.management_ticket_metro.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class GateScanResponse {
    private String result;
    private String action;
    private String message;
    private String ticketId;
    private String ticketCode;
    private String gateId;
    private String stationId;
    private LocalDateTime scannedAt;
}
