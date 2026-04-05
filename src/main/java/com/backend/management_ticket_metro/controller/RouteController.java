package com.backend.management_ticket_metro.controller;

import com.backend.management_ticket_metro.common.ApiResponse;
import com.backend.management_ticket_metro.dto.request.RouteRequest;
import com.backend.management_ticket_metro.dto.response.RouteDetailResponse;
import com.backend.management_ticket_metro.dto.response.RouteResponse;
import com.backend.management_ticket_metro.service.RouteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/routes")
@RequiredArgsConstructor
public class RouteController {
    private final RouteService routeService;

    @GetMapping
    public ApiResponse<List<RouteResponse>> getRoutes() {
        return ApiResponse.<List<RouteResponse>>builder()
                .results(routeService.getAllRoutes())
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<RouteDetailResponse> getRoute(@PathVariable String id) {
        return ApiResponse.<RouteDetailResponse>builder()
                .results(routeService.getRouteById(id))
                .build();
    }

    @PostMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<RouteResponse> createRoute(@Valid @RequestBody RouteRequest request) {
        return ApiResponse.<RouteResponse>builder()
                .results(routeService.createRoute(request))
                .build();
    }

    @PutMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<RouteResponse> updateRoute(@PathVariable String id, @RequestBody RouteRequest request) {
        return ApiResponse.<RouteResponse>builder()
                .results(routeService.updateRoute(id, request))
                .build();
    }
}
