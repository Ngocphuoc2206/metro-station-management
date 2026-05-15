package com.backend.management_ticket_metro.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class GateScanLogResponse {
    private String id;
    private String gateId;
    private String gateCode;
    private String stationId;
    private String stationName;
    private String ticketId;
    private String ticketCode;
    private String action;
    private String result;
    private String message;
    private LocalDateTime scannedAt;
}
