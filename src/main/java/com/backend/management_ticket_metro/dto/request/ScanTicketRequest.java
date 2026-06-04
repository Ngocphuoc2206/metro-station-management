package com.backend.management_ticket_metro.dto.request;

import com.backend.management_ticket_metro.enums.GateAction;
import lombok.Data;

@Data
public class ScanTicketRequest {
    private String qrContent;
    private String deviceId;
    private String stationId;
    private String gateId;
    private GateAction action;
}
