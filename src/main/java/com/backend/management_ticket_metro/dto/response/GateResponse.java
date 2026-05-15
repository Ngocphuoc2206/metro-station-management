package com.backend.management_ticket_metro.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class GateResponse {
    private String gateId;
    private String gateCode;
    private String name;
    private String stationId;
    private String stationName;
    private String action;
    private String status;
}
