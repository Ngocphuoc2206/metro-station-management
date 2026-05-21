package com.backend.management_ticket_metro.repository;

import com.backend.management_ticket_metro.entity.Ticket;
import com.backend.management_ticket_metro.entity.TicketUsage;
import com.backend.management_ticket_metro.entity.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface TicketUsageRepository extends JpaRepository<TicketUsage, String> {
    List<TicketUsage> findByTicketOrderByScannedAtDesc(Ticket ticket);

    // ---Dashboard ---
    // Count the total number of successful card swipes by the User through the ticket.user relationship.
    long countByTicketUserAndSuccessTrue(User user);

    //Retrieve the recent travel history of all tickets belonging to this User.
    List<TicketUsage> findByTicketUserOrderByScannedAtDesc(User user, Pageable pageable);

    //Trip history
    @Query("""
        SELECT tu FROM TicketUsage tu
        WHERE tu.ticket.user = :user
          AND tu.success = true
          AND (:ticketId IS NULL OR tu.ticket.id = :ticketId)
          AND (:stationId IS NULL OR tu.stationId = :stationId)
          AND (:from IS NULL OR tu.scannedAt >= :from)
          AND (:to IS NULL OR tu.scannedAt <= :to)
        ORDER BY tu.scannedAt DESC
    """)
    List<TicketUsage> findTripHistoryRaw(
            @Param("user") User user,
            @Param("ticketId") String ticketId,
            @Param("stationId") String stationId,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );
}
