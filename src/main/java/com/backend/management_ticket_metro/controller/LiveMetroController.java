package com.backend.management_ticket_metro.controller;

import com.backend.management_ticket_metro.common.ApiResponse;
import com.backend.management_ticket_metro.dto.response.LiveStationStatusResponse;
import com.backend.management_ticket_metro.dto.response.LiveTrainResponse;
import com.backend.management_ticket_metro.service.LiveMetroService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/live")
@RequiredArgsConstructor
public class LiveMetroController {
    private final LiveMetroService liveMetroService;
    @GetMapping("/trains")
    public ApiResponse<List<LiveTrainResponse>> getLiveTrains(
            @RequestParam(required = false) String routeId
    ) {
        return ApiResponse.<List<LiveTrainResponse>>builder()
                .results(liveMetroService.getLiveTrains(routeId))
                .build();
    }

    @GetMapping("/stations/status")
    public ApiResponse<List<LiveStationStatusResponse>> getLiveStationStatuses() {
        return ApiResponse.<List<LiveStationStatusResponse>>builder()
                .results(liveMetroService.getLiveStationStatuses())
                .build();
    }
}
