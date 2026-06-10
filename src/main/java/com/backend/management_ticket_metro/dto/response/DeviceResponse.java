package com.backend.management_ticket_metro.dto.response;

import lombok.*;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeviceResponse {
    private String deviceId;
    private String deviceCode;
    private String name;
    private String ipAddress;
    private String macAddress;
    private String status;

    private String stationId;
    private String stationName;
    private String gateId;
    private String gateName;

    private String typeName;
    private LocalDateTime lastMaintenance;

    //  (GateDetail, TVMDetail...) dựa trên type
    private Map<String, Object> additionalDetails;
}
