package com.backend.management_ticket_metro.controller;

import com.backend.management_ticket_metro.common.ApiResponse;
import com.backend.management_ticket_metro.dto.response.StaffShiftResponse;
import com.backend.management_ticket_metro.service.StaffShiftService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/staff/shifts")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
public class StaffShiftController {

    private final StaffShiftService staffShiftService;

    @GetMapping("/current")
    public ApiResponse<StaffShiftResponse> getCurrentShift() {
        return ApiResponse.<StaffShiftResponse>builder()
                .results(staffShiftService.getCurrentShift())
                .build();
    }

    @GetMapping("/weekly")
    public ApiResponse<List<StaffShiftResponse>> getWeeklyShifts() {
        return ApiResponse.<List<StaffShiftResponse>>builder()
                .results(staffShiftService.getWeeklyShifts())
                .build();
    }

    @PostMapping("/check-in")
    public ApiResponse<StaffShiftResponse> checkIn() {
        return ApiResponse.<StaffShiftResponse>builder()
                .results(staffShiftService.checkIn())
                .build();
    }

    @PostMapping("/check-out")
    public ApiResponse<StaffShiftResponse> checkOut() {
        return ApiResponse.<StaffShiftResponse>builder()
                .results(staffShiftService.checkOut())
                .build();
    }
}
