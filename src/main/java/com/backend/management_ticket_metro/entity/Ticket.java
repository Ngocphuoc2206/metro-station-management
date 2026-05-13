package com.backend.management_ticket_metro.entity;

import com.backend.management_ticket_metro.enums.TicketStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(
        name = "tickets",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_tickets_ticket_code", columnNames = "ticket_code")
        }
)
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "ticket_code", nullable = false, unique = true, length = 50)
    private String ticketCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TicketStatus status;

    @Column(nullable = false)
    private LocalDateTime issuedAt;

    private LocalDateTime activatedAt;

    private LocalDateTime usedAt;

    private LocalDateTime expiredAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_item_id", nullable = false)
    private OrderItem orderItem;
}