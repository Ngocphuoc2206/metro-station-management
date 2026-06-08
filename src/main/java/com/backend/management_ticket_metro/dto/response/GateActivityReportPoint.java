package com.backend.management_ticket_metro.dto.response;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GateActivityReportPoint {
    private String gateId;
    private String gateCode;
    private String gateName;
    private String stationName;
    private Long totalScanCount;
    private Long allowCount;
    private Long denyCount;
}