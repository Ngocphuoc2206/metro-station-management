package com.backend.management_ticket_metro.controller;

import com.backend.management_ticket_metro.common.ApiResponse;
import com.backend.management_ticket_metro.dto.request.ScanTicketRequest;
import com.backend.management_ticket_metro.dto.request.UpdateGateStatusRequest;
import com.backend.management_ticket_metro.dto.response.GateResponse;
import com.backend.management_ticket_metro.dto.response.GateScanLogResponse;
import com.backend.management_ticket_metro.dto.response.GateScanResponse;
import com.backend.management_ticket_metro.service.GateService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("api/v1/staff/gates")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
public class StaffGateController {
    private final GateService gateService;

    @PostMapping("/scan")
    public ApiResponse<GateScanResponse> scan(@RequestBody ScanTicketRequest request){
        return ApiResponse.<GateScanResponse>builder()
                .results(gateService.scan(request))
                .build();
    }

    @GetMapping("/logs")
    public ApiResponse<List<GateScanLogResponse>> getLogs(
            @RequestParam(required = false) String stationId,
            @RequestParam(required = false) String gateId,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime to
    ) {
        return ApiResponse.<List<GateScanLogResponse>>builder()
                .results(gateService.getLogs(stationId, gateId, from, to))
                .build();
    }

    @GetMapping
    public ApiResponse<List<GateResponse>> getGates() {
        return ApiResponse.<List<GateResponse>>builder()
                .results(gateService.getGates())
                .build();
    }

    @PutMapping("/{id}/status")
    public ApiResponse<GateResponse> updateStatus(
            @PathVariable String id,
            @RequestBody UpdateGateStatusRequest request
    ) {
        return ApiResponse.<GateResponse>builder()
                .results(gateService.updateGateStatus(id, request))
                .build();
    }
}
