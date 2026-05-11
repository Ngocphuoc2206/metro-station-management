package com.backend.management_ticket_metro.service;

import com.backend.management_ticket_metro.common.ErrorCode;
import com.backend.management_ticket_metro.dto.response.PaymentResponse;
import com.backend.management_ticket_metro.entity.Order;
import com.backend.management_ticket_metro.entity.Payment;
import com.backend.management_ticket_metro.enums.OrderStatus;
import com.backend.management_ticket_metro.enums.PaymentStatus;
import com.backend.management_ticket_metro.exception.AppException;
import com.backend.management_ticket_metro.mapper.PaymentMapper;
import com.backend.management_ticket_metro.repository.OrderRepository;
import com.backend.management_ticket_metro.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentService {
    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final PaymentMapper paymentMapper;

    @Transactional
    public PaymentResponse initPayment(String orderId, String method) {
        //Check if this order has ever been initiated for payment.
        Optional<Payment> existingPayment = paymentRepository.findByOrderOrderId(orderId);
        if (existingPayment.isPresent() && existingPayment.get().getStatus() == PaymentStatus.PENDING) {
            return paymentMapper.toPaymentResponse(existingPayment.get());
        }
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_NOT_FOUND));
        LocalDateTime now = LocalDateTime.now();

        Payment payment = Payment.builder()
                .order(order)
                .amount(order.getTotalAmount())
                .status(PaymentStatus.PENDING)
                .method(method)
                .transactionId("mock-txn-" + UUID.randomUUID())
                .clientSecret("mock-secret-" + UUID.randomUUID())
                .createdAt(now)
                .expiredAt(now.plusMinutes(15)) // Hết hạn sau 15p
                .build();
        payment = paymentRepository.save(payment);

        payment.setPaymentUrl("https://mock-pay.local/checkout?paymentId=" + payment.getPaymentId());

        return paymentMapper.toPaymentResponse(payment);
    }
    @Transactional
    public PaymentResponse processCallback(String paymentId, String transactionId, boolean isSuccess) {
        //Check if the transaction has been processed
        //if transactionId existinged, return existinged
       Optional<Payment> existingPayment = paymentRepository.findByTransactionId(transactionId);
       if(existingPayment.isPresent() && existingPayment.get().getStatus() == PaymentStatus.SUCCESS)
       {
           return paymentMapper.toPaymentResponse(existingPayment.get());
       }

       Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_NOT_FOUND));

        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            return paymentMapper.toPaymentResponse(payment);
        }

        if(isSuccess) {
            payment.setStatus(PaymentStatus.SUCCESS);
            payment.setTransactionId(transactionId);

            Order order = payment.getOrder();
            order.setStatus(OrderStatus.PAID);
            orderRepository.save(order);
        }else {
            payment.setStatus(PaymentStatus.FAILED);
        }
        Payment upatedPayment = paymentRepository.save(payment);
        return paymentMapper.toPaymentResponse(upatedPayment);
    }
    @Transactional
    public PaymentResponse getPaymentById(String id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_NOT_FOUND));
        return paymentMapper.toPaymentResponse(payment);
    }
}
