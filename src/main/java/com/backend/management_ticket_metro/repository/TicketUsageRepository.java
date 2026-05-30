package com.backend.management_ticket_metro.repository;

import com.backend.management_ticket_metro.entity.Ticket;
import com.backend.management_ticket_metro.entity.TicketUsage;
import com.backend.management_ticket_metro.entity.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

public interface TicketUsageRepository extends JpaRepository<TicketUsage, String> {
    List<TicketUsage> findByTicketOrderByScannedAtDesc(Ticket ticket);

    // ---Dashboard ---
    long countByTicketUserAndSuccessTrue(User user);

    List<TicketUsage> findByTicketUserOrderByScannedAtDesc(User user, Pageable pageable);

    // Trip history - Đã sửa để hỗ trợ danh sách nhiều Ticket ID cùng lúc
    @Query("""
        SELECT tu FROM TicketUsage tu
        WHERE tu.ticket.user = :user
          AND tu.success = true
          AND (COALESCE(:ticketIds, NULL) IS NULL OR tu.ticket.id IN :ticketIds)
          AND (:stationId IS NULL OR tu.stationId = :stationId)
          AND (:from IS NULL OR tu.scannedAt >= :from)
          AND (:to IS NULL OR tu.scannedAt <= :to)
        ORDER BY tu.scannedAt DESC
    """)
    List<TicketUsage> findTripHistoryRaw(
            @Param("user") User user,
            @Param("ticketIds") Collection<String> ticketIds, // String -> Collection<String>
            @Param("stationId") String stationId,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );
}