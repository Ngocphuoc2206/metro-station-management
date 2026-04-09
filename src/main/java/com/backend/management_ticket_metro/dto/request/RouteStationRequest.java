package com.backend.management_ticket_metro.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Data
public class RouteStationRequest {
    @NotBlank(message = "STATION_ID_REQUIRED")
    private String stationId;

    @Min(value = 0, message = "TRAVEL_TIME_INVALID")
    private int travelTimeNext;

    @NotNull(message = "DISTANCE_REQUIRED")
    @PositiveOrZero(message = "DISTANCE_INVALID")
    private Double distanceNext;
}
