package com.backend.management_ticket_metro.controller;

import com.backend.management_ticket_metro.common.ApiResponse;
import com.backend.management_ticket_metro.dto.response.ScheduleResponse;
import com.backend.management_ticket_metro.service.ScheduleService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ScheduleController {
    private final ScheduleService scheduleService;

    @GetMapping("/schedules")
    public ApiResponse<List<ScheduleResponse>> getSchedules(
            @RequestParam(required = false) String routeId,
            @RequestParam(required = false) String stationId,
            @RequestParam(required = false) String direction
    ) {
        return ApiResponse.<List<ScheduleResponse>>builder()
                .results(scheduleService.getSchedules(routeId, stationId, direction))
                .build();
    }

    @GetMapping("/routes/{id}/schedule")
    public ApiResponse<List<ScheduleResponse>> getScheduleByRoute(@PathVariable String id) {
        return ApiResponse.<List<ScheduleResponse>>builder()
                .results(scheduleService.getSchedulesByRoute(id))
                .build();
    }
}