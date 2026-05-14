package com.backend.management_ticket_metro.controller;

import com.backend.management_ticket_metro.common.ApiResponse;
import com.backend.management_ticket_metro.dto.response.TicketQrTokenResponse;
import com.backend.management_ticket_metro.dto.response.TicketResponse;
import com.backend.management_ticket_metro.dto.response.TicketUsageResponse;
import com.backend.management_ticket_metro.service.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/my/tickets")
@RequiredArgsConstructor
public class MyTicketController {

    private final TicketService ticketService;

    @GetMapping
    public ApiResponse<List<TicketResponse>> getMyTickets() {
        return ApiResponse.<List<TicketResponse>>builder()
                .results(ticketService.getMyTickets())
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<TicketResponse> getMyTicket(@PathVariable String id) {
        return ApiResponse.<TicketResponse>builder()
                .results(ticketService.getMyTicket(id))
                .build();
    }

    @PostMapping("/{id}/qr-token")
    public ApiResponse<TicketQrTokenResponse> generateQrToken(@PathVariable String id) {
        return ApiResponse.<TicketQrTokenResponse>builder()
                .results(ticketService.generateQrToken(id))
                .build();
    }

    @GetMapping("/{id}/history")
    public ApiResponse<List<TicketUsageResponse>> getTicketHistory(@PathVariable String id) {
        return ApiResponse.<List<TicketUsageResponse>>builder()
                .results(ticketService.getMyTicketHistory(id))
                .build();
    }
}
