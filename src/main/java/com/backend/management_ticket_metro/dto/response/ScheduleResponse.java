package com.backend.management_ticket_metro.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleResponse {
    private String id;
    private String routeId;
    private String routeName;
    private String stationName;
    private String stationId;
    private String direction;
    private String departureTime;
    private String arrivalTime;
    private Integer frequencyMinutes;
    private String status;
}