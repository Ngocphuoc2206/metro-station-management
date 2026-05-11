package com.backend.management_ticket_metro.repository;

import com.backend.management_ticket_metro.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, String> {
    // Search for payment information based on order number.
    Optional<Payment> findByOrderOrderId(String orderId);
    //Search by transaction code from your wallet (MoMo, ZaloPay)
    Optional<Payment> findByTransactionId(String transactionId);
}
