package com.backend.management_ticket_metro.dto.request;

import com.backend.management_ticket_metro.enums.RouteStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RouteRequest {

    @NotBlank(message = "Route name required")
    @Size(min = 5, max = 150, message = "ROUTE_NAME_INVALID_SIZE")
    private String routeName;
    private String routeCode;
    private String color;
    @NotNull(message = "Status required")
    private RouteStatus status;

    @NotEmpty(message = "Stations list required")
    @Valid
    private List<RouteStationRequest> stations;
}
