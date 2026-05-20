package com.backend.management_ticket_metro.controller;

import com.backend.management_ticket_metro.common.ApiResponse;
import com.backend.management_ticket_metro.dto.response.PassengerDashboardResponse;
import com.backend.management_ticket_metro.service.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/my/dashboard")
@RequiredArgsConstructor
public class MyDashboardController {

    private final TicketService ticketService;

    @GetMapping
    public ApiResponse<PassengerDashboardResponse> getDashboardOverview() {
        return ApiResponse.<PassengerDashboardResponse>builder()
                .results(ticketService.getPassengerDashboard())
                .build();
    }
}