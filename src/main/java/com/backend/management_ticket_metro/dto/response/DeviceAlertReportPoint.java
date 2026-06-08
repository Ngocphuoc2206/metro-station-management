package com.backend.management_ticket_metro.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeviceAlertReportPoint {
    private String deviceId;
    private String deviceCode;
    private String deviceName;
    private String deviceType;
    private String stationName;
    private String currentStatus;
    private String incidentTitle;
    private String incidentPriority;
    private LocalDateTime reportedAt;
}