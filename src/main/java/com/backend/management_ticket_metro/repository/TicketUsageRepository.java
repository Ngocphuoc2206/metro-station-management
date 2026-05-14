package com.backend.management_ticket_metro.repository;

import com.backend.management_ticket_metro.entity.Ticket;
import com.backend.management_ticket_metro.entity.TicketUsage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TicketUsageRepository extends JpaRepository<TicketUsage, String> {
    List<TicketUsage> findByTicketOrderByScannedAtDesc(Ticket ticket);
}
