package com.backend.management_ticket_metro.controller;

import com.backend.management_ticket_metro.common.ApiResponse;
import com.backend.management_ticket_metro.dto.request.OrderRequest;
import com.backend.management_ticket_metro.dto.response.OrderResponse;
import com.backend.management_ticket_metro.entity.Order;
import com.backend.management_ticket_metro.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {
    private final OrderService orderService;

    @PostMapping("/preview")
    public ApiResponse<OrderResponse> previewOrder(@Valid @RequestBody OrderRequest request){
        return ApiResponse.<OrderResponse>builder()
                .results(orderService.previewOrder(request))
                .build();
    }
    @PostMapping
    public ApiResponse<OrderResponse> createOrder(@Valid @RequestBody OrderRequest request) {
        return ApiResponse.<OrderResponse>builder()
                .results(orderService.createOrder(request))
                .build();
    }
    @GetMapping("/{id}")
    public ApiResponse<OrderResponse> getOrder(@PathVariable String id){
        return ApiResponse.<OrderResponse>builder()
                .results(orderService.getOrderById(id))
                        .build();
    }
}
