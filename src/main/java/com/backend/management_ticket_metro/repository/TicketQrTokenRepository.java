package com.backend.management_ticket_metro.repository;

import com.backend.management_ticket_metro.entity.Ticket;
import com.backend.management_ticket_metro.entity.TicketQrToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface TicketQrTokenRepository extends JpaRepository<TicketQrToken, String> {
    Optional<TicketQrToken> findByToken(String token);

    List<TicketQrToken> findByTicketAndUsedAtIsNullAndRevokedAtIsNullAndExpiresAtAfter(
            Ticket ticket,
            LocalDateTime now
    );}
