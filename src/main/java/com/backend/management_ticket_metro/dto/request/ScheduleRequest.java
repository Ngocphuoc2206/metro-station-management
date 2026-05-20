package com.backend.management_ticket_metro.dto.request;

import com.backend.management_ticket_metro.enums.ScheduleDirection;
import com.backend.management_ticket_metro.enums.ScheduleStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalTime;

@Data
public class ScheduleRequest {
    private String routeId;
    private String stationId;
    private ScheduleDirection direction;
    private LocalTime departureTime;
    private LocalTime arrivalTime;
    private Integer frequencyMinutes;
    private ScheduleStatus status = ScheduleStatus.ACTIVE;
}