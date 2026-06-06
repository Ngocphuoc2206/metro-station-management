package com.backend.management_ticket_metro.controller;

import com.backend.management_ticket_metro.common.ApiResponse;
import com.backend.management_ticket_metro.dto.response.DeviceResponse;
import com.backend.management_ticket_metro.dto.response.DeviceTypeResponse;
import com.backend.management_ticket_metro.service.DeviceService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/staff/devices")
@RequiredArgsConstructor
public class DeviceStaffController {
    private final DeviceService deviceService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ApiResponse<List<DeviceResponse>> getAllDevices() {
        List<DeviceResponse> results = deviceService.getAllDevices();
        return ApiResponse.<List<DeviceResponse>>builder()
                .results(results)
                .build();
    }
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ApiResponse<DeviceResponse> getDeviceById(@PathVariable String id) {
        DeviceResponse results = deviceService.getDeviceById(id);
        return ApiResponse.<DeviceResponse>builder()
                .results(results)
                .build();
    }
    @GetMapping("/types")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ApiResponse<List<DeviceTypeResponse>> getAllDeviceTypes() {
        List<DeviceTypeResponse> results = deviceService.getAllDeviceTypes();
        return ApiResponse.<List<DeviceTypeResponse>>builder()
                .results(results)
                .build();
    }
}
