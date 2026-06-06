package com.backend.management_ticket_metro.controller;

import com.backend.management_ticket_metro.common.ApiResponse;
import com.backend.management_ticket_metro.dto.request.IncidentRequest;
import com.backend.management_ticket_metro.dto.response.IncidentCommentResponse;
import com.backend.management_ticket_metro.dto.response.IncidentResponse;
import com.backend.management_ticket_metro.service.IncidentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/staff/incidents")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
public class StaffIncidentController {
    private final IncidentService incidentService;

    @GetMapping
    public ApiResponse<List<IncidentResponse>> getAll(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String stationId
    ) {
        return ApiResponse.<List<IncidentResponse>>builder()
                .results(incidentService.getAllIncidents(status, priority, stationId))
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<IncidentResponse> getById(@PathVariable String id) {
        return ApiResponse.<IncidentResponse>builder()
                .results(incidentService.getIncidentById(id))
                .build();
    }

    @PreAuthorize("hasAnyRole('STAFF')")
    @PostMapping
    public ApiResponse<IncidentResponse> create(@Valid @RequestBody IncidentRequest request) {
        return ApiResponse.<IncidentResponse>builder()
                .results(incidentService.createIncident(request))
                .build();
    }

    @PreAuthorize("hasAnyRole('STAFF')")
    @PatchMapping("/{id}/status")
    public ApiResponse<IncidentResponse> updateStatus(@PathVariable String id, @RequestParam String status) {
        return ApiResponse.<IncidentResponse>builder()
                .results(incidentService.updateStatus(id, status))
                .build();
    }

    @PreAuthorize("hasAnyRole('STAFF')")
    @PatchMapping("/{id}/assign")
    public ApiResponse<IncidentResponse> assignStaff(@PathVariable String id, @RequestParam String staffId) {
        return ApiResponse.<IncidentResponse>builder()
                .results(incidentService.assignStaff(id, staffId))
                .build();
    }

    @PreAuthorize("hasAnyRole('STAFF')")
    @PostMapping("/{id}/comments")
    public ApiResponse<IncidentCommentResponse> addComment(@PathVariable String id, @RequestBody String content) {
        return ApiResponse.<IncidentCommentResponse>builder()
                .results(incidentService.addComment(id, content))
                .build();
    }
}