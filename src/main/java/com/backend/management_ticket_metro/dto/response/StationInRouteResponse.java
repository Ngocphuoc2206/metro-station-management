package com.backend.management_ticket_metro.dto.response;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StationInRouteResponse {
    private String stationId;
    private String name;
    private int order;
    private int travelTimeNext;
}
