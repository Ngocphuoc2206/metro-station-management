package com.backend.management_ticket_metro.controller;

import com.backend.management_ticket_metro.common.ApiResponse;
import com.backend.management_ticket_metro.dto.request.DeviceRequest;
import com.backend.management_ticket_metro.dto.response.DeviceResponse;
import com.backend.management_ticket_metro.enums.DeviceStatus;
import com.backend.management_ticket_metro.service.DeviceService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/devices")
@RequiredArgsConstructor
public class DeviceAdminController {
    private final DeviceService deviceService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<DeviceResponse> addDevice(@RequestBody DeviceRequest request) {
        return ApiResponse.<DeviceResponse>builder()
                .results(deviceService.createDevice(request))
                .build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<DeviceResponse> updateDevice(@PathVariable String id,@RequestBody DeviceRequest request) {
        return ApiResponse.<DeviceResponse>builder()
                .results(deviceService.updateDevice(id,request))
                .build();
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<DeviceResponse> updateStatus(@PathVariable String id,@RequestParam DeviceStatus status) {
        return ApiResponse.<DeviceResponse>builder()
                .results(deviceService.changeStatus(id,status))
                .build();
    }

}
