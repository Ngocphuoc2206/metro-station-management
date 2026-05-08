package com.backend.management_ticket_metro.controller;

import com.backend.management_ticket_metro.common.ApiResponse;
import com.backend.management_ticket_metro.dto.request.PaymentInitRequest;
import com.backend.management_ticket_metro.dto.response.PaymentResponse;
import com.backend.management_ticket_metro.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {
    private final PaymentService paymentService;

    @PostMapping("/init")
    public ApiResponse<PaymentResponse> init(@RequestBody PaymentInitRequest request) {
        return ApiResponse.<PaymentResponse>builder()
                .results(paymentService.initPayment(request.getOrderId(), request.getMethod()))
                .build();
    }

    @PostMapping("/callback")
    public ApiResponse<String> callback(@RequestParam String paymentId, @RequestParam String transactionId, @RequestParam boolean isSuccess) {
        paymentService.processCallback(paymentId,transactionId,isSuccess);
        return ApiResponse.<String>builder()
                .results("Cập nhập trạng thái thành công!")
                .build();
    }
    @GetMapping("/{id}")
    public ApiResponse<PaymentResponse> getPaymentById(@PathVariable String id) {
        return ApiResponse.<PaymentResponse>builder()
                .results(paymentService.getPaymentById(id))
                .build();
    }
}
