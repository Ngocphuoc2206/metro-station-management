package com.backend.management_ticket_metro.dto.request;

import lombok.Data;

@Data
public class GateRequest {
    private String gateCode;
    private String name;
    private String stationId;
    private String stationName;
    private String action;
}
