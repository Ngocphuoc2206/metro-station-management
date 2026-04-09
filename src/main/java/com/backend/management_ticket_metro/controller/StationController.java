package com.backend.management_ticket_metro.controller;

import com.backend.management_ticket_metro.common.ApiResponse;
import com.backend.management_ticket_metro.dto.request.StationRequest;
import com.backend.management_ticket_metro.dto.response.StationResponse;
import com.backend.management_ticket_metro.service.StationService;
import jakarta.validation.Valid;
import lombok.*;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class StationController {
    private final StationService stationService;

    @GetMapping("/stations")
    public ApiResponse<List<StationResponse>> getStations() {
        return ApiResponse.<List<StationResponse>>builder()
                .results(stationService.getAllStations())
                .build();
    }

    @GetMapping("/stations/{id}")
    public ApiResponse<StationResponse> getStation(@PathVariable String id) {
        return ApiResponse.<StationResponse>builder()
                .results(stationService.getStationById(id))
                .build();
    }

    @PostMapping("/admin/stations")
    public ApiResponse<StationResponse> createStation(@Valid @RequestBody StationRequest request) {
        return ApiResponse.<StationResponse>builder()
                .results(stationService.createStation(request))
                .build();
    }

    @PutMapping("/admin/stations/{id}")
    public ApiResponse<StationResponse> updateStation(
            @PathVariable String id, @RequestBody StationRequest request) {
        return ApiResponse.<StationResponse>builder()
                .results(stationService.updateStation(id, request))
                .build();
    }

    @DeleteMapping("/admin/stations/{id}")
    public ApiResponse<Void> deleteStation(@PathVariable String id) {
        stationService.deleteStation(id);
        return ApiResponse.<Void>builder().message("Deleted successfully").build();
    }
}
