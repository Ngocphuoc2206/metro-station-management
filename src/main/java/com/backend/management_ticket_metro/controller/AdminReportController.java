package com.backend.management_ticket_metro.controller;

import com.backend.management_ticket_metro.common.ApiResponse;
import com.backend.management_ticket_metro.dto.response.*;
import com.backend.management_ticket_metro.service.AdminReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminReportController {

    private final AdminReportService adminReportService;

    @GetMapping("/dashboard/summary")
    public ApiResponse<AdminDashboardSummaryResponse> getSummary(
            @RequestParam(required = false) String range,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String stationId,
            @RequestParam(required = false) String routeId) {

        return ApiResponse.<AdminDashboardSummaryResponse>builder()
                .results(adminReportService.getDashboardSummary(range, from, to, stationId, routeId))
                .build();
    }

    @GetMapping("/reports/revenue")
    public ApiResponse<List<RevenueReportPoint>> getRevenueReport(
            @RequestParam(required = false) String range,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String stationId,
            @RequestParam(required = false) String routeId) {

        return ApiResponse.<List<RevenueReportPoint>>builder()
                .results(adminReportService.getRevenueReport(range, from, to, stationId, routeId))
                .build();
    }

    @GetMapping("/reports/ticket-sales")
    public ApiResponse<List<TicketSalesReportPoint>> getTicketSalesReport(
            @RequestParam(required = false) String range,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String stationId,
            @RequestParam(required = false) String routeId) {

        return ApiResponse.<List<TicketSalesReportPoint>>builder()
                .results(adminReportService.getTicketSalesReport(range, from, to, stationId, routeId))
                .build();
    }

    @GetMapping("/reports/trips")
    public ApiResponse<List<TripsReportPoint>> getTripsReport(
            @RequestParam(required = false) String range,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String stationId,
            @RequestParam(required = false) String routeId) {

        return ApiResponse.<List<TripsReportPoint>>builder()
                .results(adminReportService.getTripsReport(range, from, to, stationId, routeId))
                .build();
    }

    @GetMapping("/reports/gate-activity")
    public ApiResponse<List<GateActivityReportPoint>> getGateActivityReport(
            @RequestParam(required = false) String range,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String stationId) {

        return ApiResponse.<List<GateActivityReportPoint>>builder()
                .results(adminReportService.getGateActivityReport(range, from, to, stationId))
                .build();
    }

    @GetMapping("/reports/device-alerts")
    public ApiResponse<List<DeviceAlertReportPoint>> getDeviceAlertsReport(
            @RequestParam(required = false) String stationId) {

        return ApiResponse.<List<DeviceAlertReportPoint>>builder()
                .results(adminReportService.getDeviceAlertsReport(stationId))
                .build();
    }
}