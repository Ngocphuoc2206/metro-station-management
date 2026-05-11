package com.backend.management_ticket_metro.entity;

import com.backend.management_ticket_metro.enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "payment")
@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String paymentId;

    @OneToOne
    @JoinColumn(name = "order_id")
    private Order order;

    private Double amount;

    @Enumerated(EnumType.STRING)
    private PaymentStatus status;

    private String method;
    private String transactionId;
    private String clientSecret;
    private LocalDateTime createdAt;
    private LocalDateTime expiredAt;
    private String paymentUrl;

}
