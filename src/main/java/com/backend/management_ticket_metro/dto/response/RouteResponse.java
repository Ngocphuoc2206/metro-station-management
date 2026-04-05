package com.backend.management_ticket_metro.dto.response;

import lombok.*;
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RouteResponse {
    private String routeId;
    private String routeName;
    private String routeCode;
    private String color;
    private String status;
}
