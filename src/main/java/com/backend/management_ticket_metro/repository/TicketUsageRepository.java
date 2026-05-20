package com.backend.management_ticket_metro.repository;

import com.backend.management_ticket_metro.entity.Ticket;
import com.backend.management_ticket_metro.entity.TicketUsage;
import com.backend.management_ticket_metro.entity.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TicketUsageRepository extends JpaRepository<TicketUsage, String> {
    List<TicketUsage> findByTicketOrderByScannedAtDesc(Ticket ticket);

    // ---Dashboard ---
    // Count the total number of successful card swipes by the User through the ticket.user relationship.
    long countByTicketUserAndSuccessTrue(User user);

    //Retrieve the recent travel history of all tickets belonging to this User.
    List<TicketUsage> findByTicketUserOrderByScannedAtDesc(User user, Pageable pageable);
}
