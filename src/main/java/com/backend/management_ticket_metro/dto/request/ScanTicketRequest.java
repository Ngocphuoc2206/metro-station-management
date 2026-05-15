package com.backend.management_ticket_metro.dto.request;

import lombok.Data;

@Data
public class ScanTicketRequest {
    private String qrContent;
    private String deviceId;
    private String gateId;
}
