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
public class StaffIncidentController {
    private final IncidentService incidentService;

    @GetMapping
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
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
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ApiResponse<IncidentResponse> getById(@PathVariable String id) {
        return ApiResponse.<IncidentResponse>builder()
                .results(incidentService.getIncidentById(id))
                .build();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ApiResponse<IncidentResponse> create(@Valid @RequestBody IncidentRequest request) {
        return ApiResponse.<IncidentResponse>builder()
                .results(incidentService.createIncident(request))
                .build();
    }

    /**
     * 1. Endpoint duyệt phiếu (Dành cho Admin): Chuyển OPEN -> APPROVED và giao cho Staff tạo phiếu
     */
    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<IncidentResponse> approveIncident(@PathVariable String id) {
        return ApiResponse.<IncidentResponse>builder()
                .results(incidentService.approveIncident(id))
                .message("Đã phê duyệt sự cố và bàn giao lệnh sửa chữa thành công")
                .build();
    }

    /**
     * 2. Endpoint tiếp nhận sửa (Dành cho Staff): Chuyển APPROVED -> IN_PROGRESS
     */
    @PatchMapping("/{id}/start")
    @PreAuthorize("hasRole('STAFF')")
    public ApiResponse<IncidentResponse> startProcessing(@PathVariable String id) {
        return ApiResponse.<IncidentResponse>builder()
                .results(incidentService.startProcessing(id))
                .message("Đã tiếp nhận hiện trường, bắt đầu tiến hành sửa chữa")
                .build();
    }

    /**
     * 3. Endpoint hoàn thành (Dành cho Staff): Chuyển IN_PROGRESS -> RESOLVED & Khôi phục thiết bị về ACTIVE
     */
    @PatchMapping("/{id}/resolve")
    @PreAuthorize("hasRole('STAFF')")
    public ApiResponse<IncidentResponse> resolveIncident(@PathVariable String id) {
        return ApiResponse.<IncidentResponse>builder()
                .results(incidentService.resolveIncident(id))
                .message("Báo cáo hoàn thành sửa chữa thành công, hệ thống tự động mở lại thiết bị")
                .build();
    }

    /**
     * 4A. Endpoint đóng phiếu (Dành cho Admin): Nghiệm thu ĐẠT, chuyển RESOLVED -> CLOSED
     */
    @PatchMapping("/{id}/close")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<IncidentResponse> closeIncident(@PathVariable String id) {
        return ApiResponse.<IncidentResponse>builder()
                .results(incidentService.closeIncident(id))
                .message("Nghiệm thu đạt yêu cầu. Đóng sự cố thành công")
                .build();
    }

    /**
     * 4B. Endpoint tái mở phiếu (Dành cho Admin): Nghiệm thu THẤT BẠI, đẩy lùi RESOLVED -> APPROVED để bắt Staff sửa lại
     */
    @PatchMapping("/{id}/reopen")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<IncidentResponse> reopenIncident(@PathVariable String id) {
        return ApiResponse.<IncidentResponse>builder()
                .results(incidentService.reopenIncident(id))
                .message("Nghiệm thu thất bại. Đã tái mở sự cố và yêu cầu xử lý lại")
                .build();
    }

    @PostMapping("/{id}/comments")
    @PreAuthorize("hasRole('STAFF')")
    public ApiResponse<IncidentCommentResponse> addComment(@PathVariable String id, @RequestBody String content) {
        return ApiResponse.<IncidentCommentResponse>builder()
                .results(incidentService.addComment(id, content))
                .build();
    }
}