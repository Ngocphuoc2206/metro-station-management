package com.backend.management_ticket_metro.controller;

import com.backend.management_ticket_metro.common.ApiResponse;
import com.backend.management_ticket_metro.dto.response.PageResponse;
import com.backend.management_ticket_metro.dto.response.TripResponse;
import com.backend.management_ticket_metro.service.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/v1/my/trips")
@RequiredArgsConstructor
public class MyTripController {

    private final TicketService ticketService;

    @GetMapping
    public ApiResponse<PageResponse<TripResponse>> getMyTrips(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(required = false) String stationId
    ) {
        PageResponse<TripResponse> results = ticketService.getMyTripHistory(page, limit, from, to, stationId);
        return ApiResponse.<PageResponse<TripResponse>>builder()
                .results(results)
                .build();
    }
}