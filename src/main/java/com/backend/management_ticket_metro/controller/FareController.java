package com.backend.management_ticket_metro.controller;

import com.backend.management_ticket_metro.common.ApiResponse;
import com.backend.management_ticket_metro.dto.request.FareMatrixRequest;
import com.backend.management_ticket_metro.dto.request.TicketTypeRequest;
import com.backend.management_ticket_metro.service.FareService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")

public class FareController {
    @Autowired
    private FareService fareService;
    @GetMapping("/fares/calculate")
    public ApiResponse<?> calculateFare(
            @RequestParam String originId,
            @RequestParam String destinationId,
            @RequestParam String ticketType
    ) {
        Double price = fareService.calculateFare(originId, destinationId, ticketType);
        return ApiResponse.builder()
                .results(price)
                .build();
    }

    @GetMapping("/ticket-types")
    public ApiResponse<?> getTicketTypes() {
        return ApiResponse.builder()
                .results(fareService.getTicketTypes())
                .build();
    }

    @PostMapping("/admin/ticket-types")
    public ApiResponse<?> createTicketType(@RequestBody TicketTypeRequest request) {
        return ApiResponse.builder()
                .results(fareService.createTicketType(request))
                .build();
    }

    @PutMapping("/admin/ticket-types/{id}")
    public ApiResponse<?> updateTicketType(
            @PathVariable String id,
            @RequestBody TicketTypeRequest request
    ) {
        return ApiResponse.builder()
                .results(fareService.updateTicketType(id, request))
                .build();
    }

    @PostMapping("/admin/fares")
    public ApiResponse<?> createFare(@RequestBody FareMatrixRequest request) {
        return ApiResponse.builder()
                .results(fareService.createFare(request))
                .build();
    }

    @PutMapping("/admin/fares/{id}")
    public ApiResponse<?> updateFare(
            @PathVariable String id,
            @RequestBody FareMatrixRequest request
    ) {
        return ApiResponse.builder()
                .results(fareService.updateFare(id, request))
                .build();
    }
}
