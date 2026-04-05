package com.backend.management_ticket_metro.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RouteDetailResponse {
    private String routeId;
    private String routeName;
    private String routeCode;
    private String color;
    private List<StationInRouteResponse> stations;
}
