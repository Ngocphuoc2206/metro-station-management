package com.backend.management_ticket_metro.controller;

import com.backend.management_ticket_metro.common.ApiResponse;
import com.backend.management_ticket_metro.dto.request.ScheduleRequest;
import com.backend.management_ticket_metro.dto.response.ScheduleResponse;
import com.backend.management_ticket_metro.service.ScheduleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/schedules")
@RequiredArgsConstructor
public class ScheduleAdminController {
    private final ScheduleService scheduleService;

    @PostMapping
    public ApiResponse<ScheduleResponse> create(@Valid @RequestBody ScheduleRequest request) {
        return ApiResponse.<ScheduleResponse>builder()
                .results(scheduleService.createSchedule(request))
                .build();
    }

    @PutMapping("/{id}")
    public ApiResponse<ScheduleResponse> update(@PathVariable String id, @Valid @RequestBody ScheduleRequest request) {
        return ApiResponse.<ScheduleResponse>builder()
                .results(scheduleService.updateSchedule(id, request))
                .build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable String id) {
        scheduleService.deleteSchedule(id);
        return ApiResponse.<Void>builder()
                .message("Deleted schedule successfully")
                .build();
    }
}